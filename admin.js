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

(async function reviewOrder() {
    let options = new chrome.Options();
    options.addArguments('--headless');  // 設置無頭模式
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    const orderIDs = [];  // 初始化订单号数组


    async function takeScreenshot(filename) {
        // 確保 screenshots 文件夾存在
        const screenshotsDir = path.join(__dirname, 'screenshots-forAdmin');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }

        let image = await driver.takeScreenshot();
        fs.writeFileSync(path.join(screenshotsDir, filename), image, 'base64');
    }

    try {

        const getOrderID = await new Promise((resolve) => {
            console.log('準備審核訂單...');
            rl.question('請輸入訂單號碼: ', resolve);
        });

        // const orderIdsInput = await new Promise((resolve) => {
        //     rl.question('請輸入訂單ID（用逗號分隔）: ', resolve);
        // });
        // const orderIds = orderIdsInput.split(',').map(id => id.trim());

        // 打開 WordPress 登入頁面
        await driver.get('https://www.energyheart.com.tw/wp-login.php');
        console.log('已打開登入頁面');
        await takeScreenshot('1-已打開登入頁面.png');

        rl.close();
        // 等待登入表單元素顯示
        await driver.wait(until.elementLocated(By.id('user_login')), 30000);

        // 填寫登入表單
        const adminUsername = 'flowasitgoes@gmail.com';  // 替換為管理員用戶名
        const adminPassword = 'flowasitgoes@gmail.com';  // 替換為管理員密碼
        await driver.findElement(By.id('user_login')).sendKeys(adminUsername);
        await driver.findElement(By.id('user_pass')).sendKeys(adminPassword);
        await takeScreenshot('2-已填寫登入表單.png');

        // 提交登入表單
        await driver.findElement(By.id('wp-submit')).click();
        console.log('已提交登入表單');

        // 等待登入完成，檢查是否進入後台首頁
        await driver.wait(until.urlContains('wp-admin'), 30000);
        await takeScreenshot('3-登入成功進入後台.png');

        // 進入訂單頁面
        await driver.get('https://www.energyheart.com.tw/wp-admin/edit.php?post_type=shop_order');
        console.log('已進入訂單頁面');
        await takeScreenshot('4-已進入訂單頁面.png');

// 選擇單一特定訂單進行審核
// const orderId = '4975';  // 替換為特定訂單的 ID
// await driver.wait(until.elementLocated(By.xpath(`//input[@id='cb-select-${orderId}']`)), 30000);
// let checkbox = await driver.findElement(By.xpath(`//input[@id='cb-select-${orderId}']`));
// await checkbox.click();
// console.log('已勾選特定訂單checkbox');
// await takeScreenshot('5-已選擇特定訂單.png');

        // 更改訂單狀態為處理中 ------------------------------------------------------------------------

        orderIDs.push(getOrderID);

        // 遍歷每個訂單 ID
        for (let orderId of orderIDs) {
            // 選擇特定訂單進行審核
            await driver.wait(until.elementLocated(By.xpath(`//input[@id='cb-select-${orderId}']`)), 30000);
            let checkbox = await driver.findElement(By.xpath(`//input[@id='cb-select-${orderId}']`));
            await checkbox.click();
            console.log(`5-已選擇訂單-${orderId}.png`);
            await takeScreenshot(`5-已選擇訂單-${orderId}.png`);
        }

        // 更改訂單狀態
        await driver.sleep(2000); // 添加延遲以確保上一步操作完成

        await driver.findElement(By.css('#bulk-action-selector-top option[value="mark_processing"]')).click();
        console.log('6-已選擇編輯動作');
        await takeScreenshot('6-已選擇編輯動作.png');

        // 點擊執行操作按鈕
        await driver.findElement(By.id('doaction')).click();
        console.log('7-已執行更改訂單狀態動作');
        await takeScreenshot('7-已執行更改訂單狀態動作.png');

         // 更改訂單狀態為完成 ------------------------------------------------------------------------

        // 遍歷每個訂單 ID
        for (let orderId of orderIDs) {
            // 選擇特定訂單進行審核
            await driver.wait(until.elementLocated(By.xpath(`//input[@id='cb-select-${orderId}']`)), 30000);
            let checkbox = await driver.findElement(By.xpath(`//input[@id='cb-select-${orderId}']`));
            await checkbox.click();
            console.log(`8-已選擇訂單-${orderId}.png`);
            await takeScreenshot(`8-已選擇訂單-${orderId}.png`);
        }

        // 更改訂單狀態
        await driver.sleep(2000); // 添加延遲以確保上一步操作完成

        await driver.findElement(By.css('#bulk-action-selector-top option[value="mark_completed"]')).click();
        console.log('9-已選擇編輯動作');
        await takeScreenshot('9-已選擇編輯動作.png');

        // 點擊執行操作按鈕
        await driver.findElement(By.id('doaction')).click();
        console.log('10-已執行更改訂單狀態動作');
        await takeScreenshot('10-已執行更改訂單狀態動作.png');

    } finally {
        // 關閉瀏覽器
        await driver.quit();
    }
})();
