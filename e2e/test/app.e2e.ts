import { expect } from '@wdio/globals';
import { browser, $ } from '@wdio/globals';

describe('Password Manager E2E', () => {
    it('should show the create vault screen initially', async () => {
        // App sẽ load thẳng màn hình đăng nhập/tạo vault
        const createHeader = await $('h1=Tạo Vault');
        
        // Wait until elements are visible
        await createHeader.waitForExist({ timeout: 5000 });
        expect(await createHeader.isExisting()).toBe(true);

        const passwordInput = await $('input[placeholder="Mật khẩu chủ"]');
        const confirmInput = await $('input[placeholder="Xác nhận mật khẩu"]');

        // Tạo mật khẩu mới
        await passwordInput.setValue('TestPass123!');
        await confirmInput.setValue('TestPass123!');

        const submitBtn = await $('button=Khởi tạo');
        await submitBtn.click();
        
        // Chuyển hướng sang Vault
        const vaultHeader = await $('h1=Vault');
        await vaultHeader.waitForExist({ timeout: 5000 });
        expect(await vaultHeader.isExisting()).toBe(true);
    });

    it('should add a new password entry', async () => {
        const newPasswordBtn = await $('button=Mật khẩu mới');
        await newPasswordBtn.click();

        // Điền form
        const titleInput = await $('input[value=""]'); // Simplified for E2E brevity
        await titleInput.setValue('Facebook');
        
        const saveBtn = await $('button=Lưu thay đổi');
        await saveBtn.click();

        // Hiển thị toast hoặc quay lại
        const entry = await $('div=Facebook');
        await entry.waitForExist({ timeout: 5000 });
        expect(await entry.isExisting()).toBe(true);
    });
});
