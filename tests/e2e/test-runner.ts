/**
 * E2E Tester для anonimka.kz
 * 
 * Запуск: npm run test:e2e
 * 
 * Этот скрипт:
 * 1. Создаёт 2 тестовых аккаунта (если их нет)
 * 2. Выполняет все возможные операции
 * 3. Логирует все ошибки в файл
 * 4. Очищает за собой тестовые данные (опционально)
 */

import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  error?: string;
  response?: any;
  duration: number;
}

interface TestUser {
  id: number;
  token: string;
  nickname: string;
}

class E2ETester {
  private results: TestResult[] = [];
  private testUsers: TestUser[] = [];
  private reportFile: string;
  private startTime: number = 0;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.reportFile = path.join(
      __dirname,
      `../../test-reports/report-${timestamp}.json`
    );
    
    // Создаём директорию для отчётов если её нет
    const reportDir = path.dirname(this.reportFile);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  }

  async run() {
    console.log('🚀 Запуск E2E тестов...\n');
    this.startTime = Date.now();

    try {
      // Этап 1: Подготовка тестовых аккаунтов
      console.log('📋 Этап 1: Подготовка тестовых аккаунтов...');
      await this.setupTestAccounts();

      if (this.testUsers.length < 2) {
        throw new Error('Не удалось создать тестовые аккаунты');
      }

      console.log(`✅ Готовы ${this.testUsers.length} тестовых аккаунта\n`);

      // Этап 2: Тестирование основного функционала
      console.log('🧪 Этап 2: Тестирование функционала...\n');

      // Тесты User 1
      await this.testUser1Functions();

      // Тесты User 2
      await this.testUser2Functions();

      // Тесты взаимодействия
      await this.testInteractionFunctions();

      // Этап 3: Cleanup
      console.log('\n🧹 Этап 3: Очистка тестовых данных...');
      await this.cleanup();

    } catch (error) {
      console.error('❌ Критическая ошибка:', error);
      this.addResult({
        name: 'Setup/Main Flow',
        status: 'ERROR',
        error: String(error),
        duration: Date.now() - this.startTime
      });
    }

    // Сохраняем отчёт
    this.saveReport();
    this.printSummary();
  }

  private async setupTestAccounts() {
    // Создание или получение тестовых аккаунтов
    // Используем固定 ID для тестирования
    const testId1 = 999001; // User 1
    const testId2 = 999002; // User 2

    const user1 = await this.createOrGetUser(testId1, 'TestBot1');
    const user2 = await this.createOrGetUser(testId2, 'TestBot2');

    if (user1) this.testUsers.push(user1);
    if (user2) this.testUsers.push(user2);
  }

  private async createOrGetUser(
    tgId: number,
    nickname: string
  ): Promise<TestUser | null> {
    try {
      const start = Date.now();
      
      // Пытаемся создать пользователя или обновить существующего
      const response = await axios.post(`${API_BASE}/users`, {
        tgId,
        nickname,
        gender: 'Мужчина',
        age: 25,
        country: 'RU',
        city: 'Москва'
      });

      const duration = Date.now() - start;

      if (response.data.success) {
        this.addResult({
          name: `Create/Get User ${nickname}`,
          status: 'PASS',
          duration
        });

        return {
          id: tgId,
          token: response.data.user_token,
          nickname
        };
      } else {
        throw new Error(response.data.error || 'Unknown error');
      }
    } catch (error) {
      const duration = Date.now() - this.startTime;
      const errorMsg = this.getErrorMessage(error);

      this.addResult({
        name: `Create/Get User ${nickname}`,
        status: 'FAIL',
        error: errorMsg,
        duration
      });

      return null;
    }
  }

  private async testUser1Functions() {
    const user = this.testUsers[0];
    if (!user) return;

    console.log(`\n👤 Тесты User 1 (${user.nickname}):`);

    // Тест 1: Смена никнейма
    await this.testChangeNickname(user, 'TestBot1_v2');

    // Тест 2: Создание анкеты
    const adId = await this.testCreateAd(user);

    // Тест 3: Редактирование анкеты
    if (adId) {
      await this.testEditAd(user, adId);
    }

    // Тест 4: Закрепление анкеты
    if (adId) {
      await this.testPinAd(user, adId);
    }

    // Тест 5: Получение своих анкет
    await this.testGetMyAds(user);

    // Тест 6: Получение списка анкет
    await this.testGetAdsList(user);

    // Тест 7: Блокировка пользователя
    if (this.testUsers.length > 1) {
      await this.testBlockUser(user, this.testUsers[1].id);
    }

    // Тест 8: Изменение профиля
    await this.testUpdateProfile(user);
  }

  private async testUser2Functions() {
    const user = this.testUsers[1];
    if (!user) return;

    console.log(`\n👤 Тесты User 2 (${user.nickname}):`);

    // Тест 1: Смена никнейма
    await this.testChangeNickname(user, 'TestBot2_v2');

    // Тест 2: Создание анкеты
    const adId = await this.testCreateAd(user);

    // Тест 3: Получение списка анкет
    await this.testGetAdsList(user);

    // Тест 4: Просмотр профиля другого пользователя
    if (this.testUsers.length > 1) {
      await this.testViewUserProfile(user, this.testUsers[0].id);
    }
  }

  private async testInteractionFunctions() {
    if (this.testUsers.length < 2) return;

    const user1 = this.testUsers[0];
    const user2 = this.testUsers[1];

    console.log(`\n🔗 Тесты взаимодействия (${user1.nickname} ↔ ${user2.nickname}):`);

    // Тест 1: Отправка сообщения в мировой чат
    await this.testSendWorldChatMessage(user1);

    // Тест 2: Отправка личного сообщения
    await this.testSendPrivateMessage(user1, user2);

    // Тест 3: Создание чата
    const chatId = await this.testCreateChat(user1, user2, 1);

    // Тест 4: Отправка сообщения в чат
    if (chatId) {
      await this.testSendChatMessage(user1, chatId);
    }

    // Тест 5: Получение чатов
    await this.testGetChats(user1);

    // Тест 6: Отправка жалобы
    if (this.testUsers.length > 0) {
      // Получаем первую анкету для жалобы
      const ads = await this.getAds(user1);
      if (ads.length > 0) {
        await this.testReportAd(user2, ads[0]);
      }
    }
  }

  // ============ Тест функции ============

  private async testChangeNickname(user: TestUser, newNickname: string) {
    const testName = `Change nickname ${user.nickname} → ${newNickname}`;
    const start = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/nickname`, {
        tgId: user.id,
        nickname: newNickname
      });

      if (response.data.success) {
        user.nickname = newNickname;
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName}`);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ❌ ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testCreateAd(user: TestUser): Promise<number | null> {
    const testName = `Create ad (${user.nickname})`;
    const start = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/ads`, {
        tgId: user.id,
        userToken: user.token,
        gender: 'Мужчина',
        age: 25,
        ageFrom: 18,
        ageTo: 35,
        country: 'RU',
        city: 'Москва',
        bodyType: 'athletic',
        description: 'Test ad for automated testing'
      });

      if (response.data.success && response.data.id) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName} (ID: ${response.data.id})`);
        return response.data.id;
      } else {
        throw new Error(response.data.error || 'No ad ID returned');
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ❌ ${testName}: ${this.getErrorMessage(error)}`);
      return null;
    }
  }

  private async testEditAd(user: TestUser, adId: number) {
    const testName = `Edit ad ${adId}`;
    const start = Date.now();

    try {
      const response = await axios.put(`${API_BASE}/ads/${adId}`, {
        userToken: user.token,
        description: 'Updated test ad description',
        age: 26
      });

      if (response.data.success) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName}`);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ❌ ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testPinAd(user: TestUser, adId: number) {
    const testName = `Pin ad ${adId}`;
    const start = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/ads/${adId}/pin`, {
        userToken: user.token,
        hours: 24
      });

      if (response.data.success) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName}`);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ⚠️  ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testGetMyAds(user: TestUser) {
    const testName = `Get my ads (${user.nickname})`;
    const start = Date.now();

    try {
      const response = await axios.get(`${API_BASE}/ads?userToken=${user.token}`);

      if (response.status === 200 && Array.isArray(response.data)) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName} (${response.data.length} ads)`);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ❌ ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testGetAdsList(user: TestUser) {
    const testName = `Get ads list (${user.nickname})`;
    const start = Date.now();

    try {
      const response = await axios.get(`${API_BASE}/ads?limit=10`);

      if (response.status === 200 && Array.isArray(response.data)) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName} (${response.data.length} ads)`);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ❌ ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testBlockUser(user: TestUser, blockedUserId: number) {
    const testName = `Block user ${blockedUserId}`;
    const start = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/user-blocks`, {
        userToken: user.token,
        blockedToken: `user_${blockedUserId}`
      });

      if (response.data.success) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName}`);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ⚠️  ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testUpdateProfile(user: TestUser) {
    const testName = `Update profile (${user.nickname})`;
    const start = Date.now();

    try {
      const response = await axios.put(`${API_BASE}/users`, {
        tgId: user.id,
        userToken: user.token,
        city: 'Saint Petersburg',
        age: 26
      });

      if (response.data.success) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName}`);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ❌ ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testViewUserProfile(user: TestUser, targetUserId: number) {
    const testName = `View user profile ${targetUserId}`;
    const start = Date.now();

    try {
      const response = await axios.get(
        `${API_BASE}/users?tgId=${targetUserId}&userToken=${user.token}`
      );

      if (response.status === 200) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName}`);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ⚠️  ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testSendWorldChatMessage(user: TestUser) {
    const testName = `Send world chat message (${user.nickname})`;
    const start = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/world-chat`, {
        userToken: user.token,
        message: 'Test message from automation',
        type: 'public'
      });

      if (response.data.success) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName}`);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ⚠️  ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testSendPrivateMessage(sender: TestUser, receiver: TestUser) {
    const testName = `Send private message ${sender.nickname} → ${receiver.nickname}`;
    const start = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/send-message`, {
        userToken: sender.token,
        receiverToken: receiver.token,
        message: 'Test private message',
        type: 'private'
      });

      if (response.data.success) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName}`);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ⚠️  ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testCreateChat(user1: TestUser, user2: TestUser, adId: number): Promise<string | null> {
    const testName = `Create chat ${user1.nickname} ↔ ${user2.nickname}`;
    const start = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/create-chat`, {
        senderTgId: user1.id,
        senderToken: user1.token,
        receiverTgId: user2.id,
        adId: adId
      });

      if (response.data.success && response.data.chatId) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName} (ID: ${response.data.chatId})`);
        return response.data.chatId;
      } else {
        throw new Error(response.data.error || 'No chat ID returned');
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ⚠️  ${testName}: ${this.getErrorMessage(error)}`);
      return null;
    }
  }

  private async testSendChatMessage(user: TestUser, chatId: string) {
    const testName = `Send chat message in ${chatId.substring(0, 8)}...`;
    const start = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/neon-messages`, {
        userToken: user.token,
        chatId,
        message: 'Test chat message'
      });

      if (response.data.success) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName}`);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ⚠️  ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testGetChats(user: TestUser) {
    const testName = `Get chats (${user.nickname})`;
    const start = Date.now();

    try {
      const response = await axios.get(
        `${API_BASE}/neon-chats?userToken=${user.token}`
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName} (${response.data.length} chats)`);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ⚠️  ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  private async testReportAd(user: TestUser, ad: any) {
    const testName = `Report ad ${ad.id}`;
    const start = Date.now();

    try {
      const response = await axios.post(`${API_BASE}/reports`, {
        userToken: user.token,
        reportedUserId: ad.tg_id,
        reportedNickname: ad.display_nickname,
        reportType: 'ad',
        relatedAdId: ad.id,
        reason: 'Test report from automation'
      });

      if (response.data.success) {
        this.addResult({ name: testName, status: 'PASS', duration: Date.now() - start });
        console.log(`  ✅ ${testName}`);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      this.addResult({
        name: testName,
        status: 'FAIL',
        error: this.getErrorMessage(error),
        duration: Date.now() - start
      });
      console.log(`  ⚠️  ${testName}: ${this.getErrorMessage(error)}`);
    }
  }

  // ============ Утилиты ============

  private async getAds(user: TestUser): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE}/ads?limit=5`);
      return response.data || [];
    } catch {
      return [];
    }
  }

  private async cleanup() {
    console.log('  Удаление тестовых объявлений...');
    
    for (const user of this.testUsers) {
      try {
        const response = await axios.get(`${API_BASE}/ads?userToken=${user.token}`);
        const ads = response.data || [];

        for (const ad of ads) {
          try {
            await axios.delete(`${API_BASE}/ads/${ad.id}`, {
              data: { userToken: user.token }
            });
            console.log(`    ✅ Удалено объявление ${ad.id}`);
          } catch (error) {
            console.log(`    ⚠️  Не удалось удалить ${ad.id}`);
          }
        }
      } catch (error) {
        console.log(`    ⚠️  Ошибка при получении объявлений`);
      }
    }
  }

  private addResult(result: TestResult) {
    this.results.push(result);
  }

  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;
      return `${status}: ${message}`;
    }
    return String(error);
  }

  private saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      errors: this.results.filter(r => r.status === 'ERROR').length,
      duration: Date.now() - this.startTime,
      results: this.results
    };

    fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Отчёт сохранён: ${this.reportFile}`);
  }

  private printSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    const total = this.results.length;

    console.log('\n╔════════════════════════════════════╗');
    console.log('║         TEST SUMMARY REPORT         ║');
    console.log('╠════════════════════════════════════╣');
    console.log(`║ Total Tests:  ${total.toString().padEnd(24)}║`);
    console.log(`║ ✅ Passed:    ${passed.toString().padEnd(24)}║`);
    console.log(`║ ❌ Failed:    ${failed.toString().padEnd(24)}║`);
    console.log(`║ 💥 Errors:    ${errors.toString().padEnd(24)}║`);
    console.log(`║ ⏱️  Duration:  ${(Date.now() - this.startTime) + 'ms'.padEnd(22)}║`);
    console.log('╚════════════════════════════════════╝');

    if (failed > 0 || errors > 0) {
      console.log('\n⚠️  Проблемные тесты:');
      this.results
        .filter(r => r.status !== 'PASS')
        .forEach(r => {
          console.log(`  • ${r.name}: ${r.error}`);
        });
    }
  }
}

// Запуск
const tester = new E2ETester();
tester.run().catch(console.error);
