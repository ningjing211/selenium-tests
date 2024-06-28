const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

(async function memberShare() {
    let options = new chrome.Options();
    options.addArguments('--headless');  // 使用無頭模式，可視情況刪除此行以顯示瀏覽器操作
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    async function takeScreenshot(filename) {
        // 確保 screenshots 文件夾存在
        const screenshotsDir = path.join(__dirname, 'screenshots-memberShare');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }

        let image = await driver.takeScreenshot();
        fs.writeFileSync(path.join(screenshotsDir, filename), image, 'base64');
    }

    try {
        // 打開 WordPress 登入頁面
        await driver.get('https://www.energyheart.com.tw/wp-login.php');
        console.log('已打開登入頁面');
        await takeScreenshot('1-已打開登入頁面.png');

        // 等待登入表單元素顯示
        await driver.wait(until.elementLocated(By.id('user_login')), 30000);

        // 填寫登入表單
        const adminUsername = 'flowasitgoes@gmail.com';  // 替換為管理員用戶名
        const adminPassword = 'flowasitgoes@gmail.com';  // 替換為管理員密碼
        await driver.findElement(By.id('user_login')).sendKeys(adminUsername);
        await driver.findElement(By.id('user_pass')).sendKeys(adminPassword);
        await driver.findElement(By.id('wp-submit')).click();
        console.log('已提交登入表單');
        await takeScreenshot('2-已提交登入表單.png');

        // 等待進入 WordPress Dashboard
        console.log('已進入 WordPress Dashboard');
        await takeScreenshot('3-已進入Dashboard.png');


        // 前往使用者管理頁面
        await driver.get('https://www.energyheart.com.tw/wp-admin/users.php');
        await driver.sleep(2000); // 添加延遲以確保上一步操作完成
        console.log('已進入使用者管理頁面');
        await takeScreenshot('5-已進入使用者管理頁面.png');
        
        // 定位並點擊特定使用者的編輯鏈接
        let userName = '04415';
        let userLink = await driver.wait(until.elementLocated(By.xpath(`//td[@class='username column-username has-row-actions column-primary']//a[text()='${userName}']`)), 10000);
        // 點擊該元素
        await userLink.click();
        await driver.sleep(3000); // 等待一秒讓滾動完成
        console.log('6-點擊後進入指定使用者編輯頁面');
        await takeScreenshot('6-點擊後進入指定使用者編輯頁面.png');

        // 等待頁面加載並定位「設定新密碼」按鈕
        
        // 找到 email 輸入框元素
        let emailInput = await driver.findElement(By.id('email'));
        // 取得 email 輸入框的值
        let emailValue = await emailInput.getAttribute('value');
        console.log(emailValue);

        // 點擊「設定新密碼」按鈕
        let resetPasswordButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(@class, 'wp-generate-pw') and contains(text(), '設定新密碼')]")), 10000);
        await resetPasswordButton.click();
        console.log('7-點擊重設密碼後');
        await takeScreenshot('7-點擊重設密碼後.png');
        
        // 找到密碼輸入框元素
        let passwordInput = await driver.findElement(By.id('pass1'));

        // 清空輸入框內容（若需要）
        await passwordInput.clear();

        // 輸入新的密碼值
        let newPassword = emailValue;
        await passwordInput.sendKeys(newPassword);
        
        // 確認輸入的密碼值是否正確顯示在輸入框中（可選）
        let enteredValue = await passwordInput.getAttribute('value');
        console.log('7-2-已輸入新密碼:', enteredValue);

        // 找到並點擊提交按鈕
        let submitButton = await driver.findElement(By.id('submit'));
        await submitButton.click();
        await takeScreenshot('8-更新送出後.png');
        console.log('8-更新送出後');

    } catch (error) {
        console.error('出現錯誤:', error);
        await takeScreenshot('error.png');
    } finally {
        // 關閉瀏覽器
        await driver.quit();
    }
})();
