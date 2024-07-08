const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

async function login(userEmail) {


    console.log('admin登入審核中...將剛購買的訂單從保留改為處理改為完成');

    let options = new chrome.Options();
    // options.addArguments('--headless');  // 設置無頭模式
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    async function takeScreenshot(filename) {
        // 確保 screenshots 文件夾存在
        const screenshotsDir = path.join(__dirname, 'screenshots-forAdmin');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }
        let image = await driver.takeScreenshot();
        fs.writeFileSync(path.join(screenshotsDir, filename), image, 'base64');
    }

    let loggedIn = false;
    let attempt = 1;
    const maxAttempts = 3;  // 最大嘗試次數

    while (!loggedIn && attempt <= maxAttempts) {
        try {
            console.log(`嘗試登入，第 ${attempt} 次`);

            // 打開 WordPress 登入頁面
            await driver.get('https://www.energyheart.com.tw/wp-login.php');
            console.log('已打開登入頁面');
            await takeScreenshot(`1-已打開登入頁面_${attempt}.png`);
            // 更改訂單狀態
            await driver.sleep(4200); // 添加延遲以確保上一步操作完成
            // 等待登入表單元素顯示
            await driver.wait(until.elementLocated(By.id('user_login')), 1000);

            // 填寫登入表單
            const adminUsername = userEmail;  // 替換為管理員用戶名
            const adminPassword = userEmail;  // 替換為管理員密碼
            await driver.findElement(By.id('user_login')).sendKeys(adminUsername);
            await driver.findElement(By.id('user_pass')).sendKeys(adminPassword);
            await takeScreenshot(`2-已填寫登入表單_${attempt}.png`);

            // 提交登入表單
            await driver.findElement(By.id('wp-submit')).click();
            console.log('已提交登入表單');

            // 等待登入完成，檢查是否進入後台首頁
            await driver.wait(until.urlContains('wp-admin'), 10000);
            await takeScreenshot(`3-登入成功進入後台_${attempt}.png`);

            // 登入成功
            loggedIn = true;
            console.log('登入成功！');

        } catch (error) {
            console.error(`嘗試登入時發生錯誤: ${error.message}`);
            attempt++;
        }
        if (!loggedIn) {
            console.error(`嘗試 ${maxAttempts} 次登入失敗，請檢查網路連線或稍後再試。`);
        }
        // 登入完成後，關閉瀏覽器
        await driver.quit();
    }
};

module.exports = login;
