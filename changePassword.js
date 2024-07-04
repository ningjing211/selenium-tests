const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 設置 readline 接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

(async function memberShare() {
    let options = new chrome.Options();
    // options.addArguments('--headless');  // 使用無頭模式，可視情況刪除此行以顯示瀏覽器操作
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    async function takeScreenshot(filename) {
        // 確保 screenshots 文件夾存在
        const screenshotsDir = path.join(__dirname, 'screenshots-changePassword');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }

        let image = await driver.takeScreenshot();
        fs.writeFileSync(path.join(screenshotsDir, filename), image, 'base64');
    }

    try {
        // 打開 WordPress 登入頁面
        console.log('準備從admin登入把使用者密碼更改為跟帳號一致...');
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
        console.log('5-1-已進入使用者管理頁面');
        await takeScreenshot('5-1-已進入使用者管理頁面.png');
        
        const user_account = await new Promise((resolve) => {
            rl.question('請問您的測試帳號:', resolve);
        });
        
        rl.close();
        // 定位並點擊特定使用者的編輯鏈接
        await driver.findElement(By.id('user-search-input')).sendKeys(user_account);
        await driver.findElement(By.id('search-submit')).click();
        await driver.sleep(5000); // 等待5秒讓滾動完成
        let userName = await driver.wait(until.elementLocated(By.xpath(`//td[@class='username column-username has-row-actions column-primary']//a`)), 10000);
        await takeScreenshot('5-2-找到使用者名稱準備點擊.png');
        // // 可以在這裡對找到的元素進行操作
        await userName.click();
        await driver.sleep(3000); // 等待一秒讓滾動完成
        // let displayName = await displayNameTd.getText();
        // console.log('Display Name:', displayName);

        // 點擊該元素
        // await userLink.click();
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
        await takeScreenshot('7-2-已輸入新密碼.png');

        // 找到並點擊提交按鈕
        let submitButton = await driver.findElement(By.id('submit'));
        console.log('8-準備點擊更新送出');
        await takeScreenshot('8-準備點擊更新送出.png');
        await submitButton.click();
        console.log('8-更新送出後');
        await takeScreenshot('8-更新送出後.png');
        console.log(user_account, '的密碼已經修改為跟帳號一樣');
    } catch (error) {
        console.error('出現錯誤:', error);
        await takeScreenshot('error.png');
    } finally {
        // 關閉瀏覽器
        await driver.quit();
    }
})();
