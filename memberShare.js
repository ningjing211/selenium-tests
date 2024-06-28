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
        const adminUsername = '04415@surfman.com';  // 替換為管理員用戶名
        const adminPassword = '04415@surfman.com';  // 替換為管理員密碼
        await driver.findElement(By.id('user_login')).sendKeys(adminUsername);
        await driver.findElement(By.id('user_pass')).sendKeys(adminPassword);
        await driver.findElement(By.id('wp-submit')).click();
        console.log('已提交登入表單');
        await takeScreenshot('2-已提交登入表單.png');

        // 等待進入 WordPress Dashboard
        console.log('已進入 WordPress Dashboard');
        await takeScreenshot('3-已進入Dashboard.png');



    } catch (error) {
        console.error('出現錯誤:', error);
        await takeScreenshot('error.png');
    } finally {
        // 關閉瀏覽器
        await driver.quit();
    }
})();
