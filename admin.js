const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const xlsx = require('xlsx');

// 設置 readline 接口
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function admin(order_number, test_email) {
    console.log('admin登入審核中...將剛購買的訂單從保留改為處理改為完成');
    console.log('取得丟入的參數, 訂單號碼:', order_number, 'email:', test_email);
    let options = new chrome.Options();
    // options.addArguments('--headless');  // 設置無頭模式
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

    function getOrderNumberFromExcel(filename) {
        try {
            const filePath = path.join(__dirname, filename);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

            // 假設訂單編號在第二行第四列（A1, B1, C1, D1）
            const orderNumber = data[1][3]; // [1] 是第二行，[3] 是第四列
            const user_email = data[1][0];
            return {orderNumber, user_email};
        } catch (error) {
            console.error('Error reading Excel file:', error);
            return null;
        }
    }

    function reflectUserLevel (combo){
        switch (combo) {
            case "尊貴頭等艙":
                return "A級經銷商";
            case "能量商務艙":
                return "B級經銷商";
            case "豪華經典艙":
                return "C級經銷商";
            default:
                return "未知"; // 或者可以根據需要返回其他預設值或處理方式
        }
    }

    try {

        // //讀取檔案的功能
        // console.log('準備讀取Excel裡面的購買訂單號碼...');
        // const filename = '18793@surfman.com_purchased_results.xlsx';
        // const result = getOrderNumberFromExcel(filename);

        // let orderNumber = result.orderNumber;
        // const userEmail = result.user_email;

        // console.log('成功讀取到此帳號Email, Email:', userEmail);
        // console.log('成功讀取到訂單號碼, Order Number:', orderNumber);

        const filename = `${test_email}_purchased_results.xlsx`;
        console.log('要開啟的檔案名稱', filename);
        const result = getOrderNumberFromExcel(filename);
        const userEmail = result.user_email;
        


        let orderNumber = order_number;
        console.log('準備審核訂單...');

        const ifInput = await new Promise((resolve) => {
            rl.question('您要更改為手動輸入訂單嗎?(yes/no): ', resolve);
        });
        
        if (ifInput.trim() == 'yes' ) {
            const getOrderID = await new Promise((resolve) => {
                rl.question('請輸入訂單號碼: ', resolve);
            });
        }
        console.log('好的, 自動擷取訂單號碼為:', orderNumber);
        rl.close();
        // const orderIdsInput = await new Promise((resolve) => {
        //     rl.question('請輸入訂單ID（用逗號分隔）: ', resolve);
        // });
        // const orderIds = orderIdsInput.split(',').map(id => id.trim());

        // 打開 WordPress 登入頁面
        await driver.get('https://www.energyheart.com.tw/wp-login.php');
        await driver.sleep(4200); // 添加延遲以確保上一步操作完成
        console.log('已打開登入頁面');
        await takeScreenshot('1-已打開登入頁面.png');

        
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

        // orderIDs.push(getOrderID);
        orderIDs.push(order_number);


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

        // 前往使用者管理頁面
        //查看使用者User Level經銷商變化與否
        let orderLink = `https://www.energyheart.com.tw/wp-admin/admin.php?page=wc-orders&action=edit&id=${orderNumber}`;
        console.log('orderLink:', orderLink);
        await driver.get(orderLink);
        await driver.sleep(2000); // 添加延遲以確保上一步操作完成

        const element = await driver.findElement(By.xpath("//tbody[@id='order_line_items']//a[@class='wc-order-item-name']"));
        let boughtComboPaid = await element.getText();

        console.log('已成功購買的combo經銷商等級:', boughtComboPaid);
        console.log('11-1-已進入使用者管理頁面');
        await takeScreenshot('11-1-已進入使用者管理頁面.png');

        let currentLevel = reflectUserLevel(boughtComboPaid);
        console.log('當前使用者角色等級:', currentLevel);

        // 因為付款成功了, 所以打開檔案寫入經銷商的等級
        // 檔案路徑
        const filePath = filename; // 替換為你的實際檔案路徑

        // 讀取 Excel 檔案
        const workbook = xlsx.readFile(filePath);

        // 取得第一個工作表
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 將工作表轉換為 JSON 格式
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('改密碼前的客戶角色:', data);
        // 取得 user_email 的值（假設在第二行第二列）
        let user_level = data[1][1]; // 假設 user_level 在第二行第二列（A2, B2, C2, D2...）
        console.log(user_level);
        // 做一些處理後更新 user_level，這裡只是示範，你可以根據你的需求更新它
        user_level = currentLevel; // 假設要更新成這個新的 email

        // 將更新後的 user_level 放回原始的資料中
        data[1][1] = user_level;
        console.log('改完密碼後的客戶角色:', data[1][1]);
        // 將更新後的資料寫回 Excel 檔案
        const updatedSheet = xlsx.utils.aoa_to_sheet(data);
        workbook.Sheets[sheetName] = updatedSheet;

        // 將更新後的 Excel 檔案寫入到磁碟
        xlsx.writeFile(workbook, filePath);

        console.log('已將 user_level 更新到原始的 Excel 檔案中:', filePath);


    } finally {
        // 關閉瀏覽器
        await driver.quit();
    }
}

//await admin('5171', '39399@surfman.com');

module.exports = admin;
