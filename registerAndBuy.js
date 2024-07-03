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

(async function registerAccount() {
    let options = new chrome.Options();
    options.addArguments('--headless');  // 設置無頭模式
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--ignore-certificate-errors');  // 忽略 SSL 認證錯誤

    
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    
    async function takeScreenshot(filename) {
        // 確保 screenshots 文件夾存在
        const screenshotsDir = path.join(__dirname, 'screenshots-registerAndBuy');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }

        let image = await driver.takeScreenshot();
        fs.writeFileSync(path.join(screenshotsDir, filename), image, 'base64');
    }
    
    try {
        
        let userLevel = '';

        const ifStranger = await new Promise((resolve) => {
            rl.question('請問您是「沒有上家的陌生客戶」嗎?:（1:是, 2:不是) ', resolve);
        });

        let linkFromUpper = '';

        if (ifStranger.trim() !== '1') {
            userLevel = 'Stranger';
            linkFromUpper = await new Promise((resolve) => {
                rl.question('請輸入上家連結: ', resolve);
            });
            console.log('您輸入的連結為:', linkFromUpper);
            await driver.get(linkFromUpper);
            await driver.sleep(10000); // 假設等待 10 秒鐘
            const theURL = await driver.getCurrentUrl();
            console.log('跳轉為連結:', theURL);
            await takeScreenshot('1-1-1已打開註冊頁面.png');
            await driver.get('https://www.energyheart.com.tw/my-account/');
            await takeScreenshot('1-1-2已打開註冊頁面.png');

        } else {
            // 打開 WordPress 註冊頁面
            userLevel = 'Stranger';
            await driver.get('https://www.energyheart.com.tw/my-account/');
            console.log('已打開註冊頁面');
            await takeScreenshot('1-2-已打開註冊頁面.png');  // 截圖註冊頁面
        }

        rl.close();
        
        
        // 等待註冊表單元素顯示，增加等待時間至 30 秒
        await driver.wait(until.elementLocated(By.id('reg_email')), 30000);
        
        // 填寫註冊表單
        const timestamp = new Date().getTime().toString().slice(-5);  // 取得當前時間戳記
        const testEmail = `${timestamp}@surfman.com`;
        await driver.findElement(By.id('reg_email')).sendKeys(testEmail);  // 使用帳號格式為 timestamp + test_email@example.com

        // await driver.findElement(By.id('reg_email')).sendKeys('7guantest_email@example.com');  // 替換為要註冊的郵箱
        console.log('已填寫註冊表單');
        await takeScreenshot('2-已填寫註冊表單.png');  // 截圖填寫完的註冊表單
        
        // 提交註冊表單
        await driver.findElement(By.name('register')).click();
        console.log('已提交註冊表單');
        
        // 等待註冊完成，檢查是否進入賬戶頁面
        await driver.wait(until.urlContains('my-account'), 30000);
        await takeScreenshot('3-註冊完成進入同意頁面.png');  // 截圖註冊後頁面
        


        // 點擊「接受」按鈕，如果有的話
        async function clickAcceptButton() {
            try {
                await takeScreenshot('點選I-agree後.png');
                console.log('點選了我同意');
                await driver.wait(until.elementLocated(By.id('tpul-modal-btn-accept')), 60000); // 增加等待時間為 30 秒
                let acceptButton = await driver.findElement(By.id('tpul-modal-btn-accept'));
                console.log('元素可見確保前');
                // 確保元素可見和可交互
                await driver.wait(until.elementIsVisible(acceptButton), 10000);
                await driver.wait(until.elementIsEnabled(acceptButton), 10000);
                console.log('元素可見確保後+使用javascript點擊繞過交互性問題');
                // 使用 JavaScript 點擊，有時候可以繞過某些交互性問題
                await driver.executeScript("arguments[0].click();", acceptButton);
                console.log('繞過問題了');
                // 等待營運規章 loading 完成，可以根據具體網頁的 loading 時間調整等待時間
                await driver.sleep(5000); // 假設等待 5 秒鐘
                console.log('已點擊接受按鈕');
                await takeScreenshot('4-點擊後-我的帳號頁面-您好.png');  // 截圖接受cookies
            } catch (error) {
                console.error('無法找到或點擊接受按鈕', error);
                await takeScreenshot('8-accept_button_error.png');  // 截圖找不到接受按鈕或點擊錯誤
            }
        }



        // 在進行結帳流程之前，先點擊接受按鈕
        await clickAcceptButton();
        

        // 模擬購物流程
        // 進入購物頁面 https://www.energyheart.com.tw/products/
        await driver.get('https://www.energyheart.com.tw/products/');
        console.log('已進入購物頁面');

        // 點擊「新航域合作專區」
        await driver.findElement(By.xpath('//div[contains(text(), "新航域合作專區")]')).click();
        console.log('已點擊「新航域合作專區」');
        await takeScreenshot('5-進入新航域合作專區.png');  // 截圖選擇專區
        
        // 選擇購買「豪華經典艙」
        const comboName = '豪華經典艙';
        await driver.findElement(By.xpath('//h2[contains(text(), "豪華經典艙")]')).click();
        console.log('已選擇「豪華經典艙」');
        await takeScreenshot('6-選擇豪華經典艙.png');  // 截圖選擇產品
        
       // 加入購物車
        let addToCartButton = await driver.findElement(By.css('.single_add_to_cart_button'));
        await driver.wait(until.elementIsVisible(addToCartButton), 10000); // 等待元素可見
        await addToCartButton.click();
        await takeScreenshot('71-點選加入購物車.png');  // 截圖選擇產品
        console.log('已加入購物車');
        await driver.sleep(5000); // 假設等待 5 秒鐘
        await takeScreenshot('72-可以查看購物車了.png');  // 截圖選擇產品
        
        // 進入購物車頁面
        await driver.get('https://www.energyheart.com.tw/checkout-2/');
        console.log('已進入購物車頁面');
        await takeScreenshot('81-進入購物車頁面.png');

        // 假設這裡需要進行結帳的相關操作，例如選擇配送方式、填寫地址等
        await driver.sleep(7000);
        await takeScreenshot('82-讓購物車頁面跳轉後.png');

        const testFirstName = '姓test';
        const testLastName = '名test';
        const testPhone ='0966168777';
        await driver.findElement(By.name('billing_first_name')).sendKeys(testFirstName);
        await takeScreenshot('91-selected_product.png');
        await driver.findElement(By.name('billing_last_name')).sendKeys(testLastName);
        await takeScreenshot('92-selected_product.png');
        await driver.findElement(By.name('billing_phone')).sendKeys(testPhone);
        await takeScreenshot('93-selected_product.png');

        await driver.findElement(By.name('woocommerce_checkout_place_order')).click();
        console.log('已結帳囉, 等待跳轉');
        await driver.sleep(15000);
        console.log('跳轉成功 - 顯示訂單頁面');
        await takeScreenshot('94-完成結帳.png');
        // 查找 <li> 标签中的 <strong> 子标签
        const strongElement = await driver.findElement(By.css('.woocommerce-order-overview__order.order strong'));
        const orderNumber = await strongElement.getText();
        console.log('取得訂單編號-', orderNumber);


        // 將結果保存到Excel
        const workbook = xlsx.utils.book_new();
        const worksheetData = [
        ['User Email', 'User Level', 'Purchased combo', 'orderNumber'],
        [testEmail, userLevel, comboName, orderNumber, /* more data here */]
        ];
        const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Test Results');
        xlsx.writeFile(workbook, 'purchased_results.xlsx');
        console.log('寫入Excel檔案並輸出:', 'purchased_results.xlsx');
        // await driver.sleep(15000);
        // await takeScreenshot('83-selected_product.png');
        // 2. 填寫配送地址等相關操作

        // 假設還有其他結帳步驟，例如點擊確認按鈕等

        console.log('完成結帳流程');

    } finally {
        // 關閉瀏覽器
        await driver.quit();
    }
})();
