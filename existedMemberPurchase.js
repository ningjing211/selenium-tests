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
        const screenshotsDir = path.join(__dirname, 'screenshots-existedMemberPurchase');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }

        let image = await driver.takeScreenshot();
        fs.writeFileSync(path.join(screenshotsDir, filename), image, 'base64');
    }
    
    try {
        
        let userLevel = '';

        const user_account = await new Promise((resolve) => {
            rl.question('請問您的測試帳號:', resolve);
        });
        const user_password = await new Promise((resolve) => {
            rl.question('請問您的測試密碼:', resolve);
        });

        // 這裡要加一段 admin.js 去查詢這個「測試帳號」經銷商等級的機制, 去更改userLevel

        // 打開 WordPress 登入頁面
        await driver.get('https://www.energyheart.com.tw/wp-login.php');
        console.log('Admin檢查此帳號客戶角色....');
        await takeScreenshot('Admin-已打開登入頁面.png');

        // 等待登入表單元素顯示
        await driver.wait(until.elementLocated(By.id('user_login')), 10000);

        // 填寫登入表單
        const adminUsername = 'flowasitgoes@gmail.com';  // 替換為管理員用戶名
        const adminPassword = 'flowasitgoes@gmail.com';  // 替換為管理員密碼
        await driver.findElement(By.id('user_login')).sendKeys(adminUsername);
        await driver.findElement(By.id('user_pass')).sendKeys(adminPassword);
        await takeScreenshot('Admin-已填寫登入表單.png');

        // 提交登入表單
        await driver.findElement(By.id('wp-submit')).click();
        console.log('Admin-已提交登入表單');

        // 等待登入完成，檢查是否進入後台首頁
        await driver.wait(until.urlContains('wp-admin'), 30000);
        await takeScreenshot('Admin-成功登入後台.png');

        // 切換到使用者頁面，準備查看登入者帳號的使用者角色(經銷商等級)
        await driver.get('https://www.energyheart.com.tw/wp-admin/users.php');
        console.log('Admin-已進入使用者頁面');
        await takeScreenshot('Admin-已進入使用者頁面.png');
        await driver.findElement(By.id('user-search-input')).sendKeys(user_account);
        await driver.findElement(By.id('search-submit')).click();
        console.log('Admin-搜尋完成-顯示搜尋結果');
        await takeScreenshot('Admin-搜尋完成-顯示搜尋結果.png');
        
        await driver.sleep(7000); // 假設等待 7 秒鐘
        
        const tdValue = await driver.findElement(By.xpath('//td[@class="role column-role" and @data-colname="使用者角色"]')).getText();
        console.log(`${user_account}的使用者角色為:`, tdValue);

        // Second Login 使用者帳號輸入登入
        await driver.get('https://www.energyheart.com.tw/wp-login.php');
        console.log('1-已打開登入頁面');
        await takeScreenshot('1-已打開登入頁面.png');

        // 等待登入表單元素顯示
        await driver.wait(until.elementLocated(By.id('user_login')), 7000);

        // 填寫登入表單
        const userAccount = user_account;  // 替換為管理員用戶名
        const userPassword = user_password;  // 替換為管理員密碼
        // console.log(userAccount, userPassword);
        // 使用 JavaScript 設置輸入框的值

        await takeScreenshot('aaa.png');
        await driver.executeScript("document.getElementById('user_login').setAttribute('value', arguments[0]);", userAccount);
        await takeScreenshot('bbb.png');
        await driver.findElement(By.id('user_pass')).sendKeys(userPassword);
        await takeScreenshot('ccc.png');
        console.log('2-已填寫登入表單');
        await takeScreenshot('2-已填寫登入表單.png');

        // 提交登入表單
        console.log('3-提交登入表單前(about to click)');
        await driver.findElement(By.id('wp-submit')).click();
        await takeScreenshot('ddd.png');
        console.log('3-已提交登入表單(after clicked)');

        // 點擊「接受」按鈕，如果有的話
        console.log('準備點擊接受同意按鈕');
        async function clickAcceptButton() {
            try {
                await takeScreenshot('點選I-agree後.png');
                console.log('點選了我同意');
                await driver.wait(until.elementLocated(By.id('tpul-modal-btn-accept')), 15000); // 增加等待時間為 15 秒
                let acceptButton = await driver.findElement(By.id('tpul-modal-btn-accept'));
                console.log('元素可見確保前');
                // 確保元素可見和可交互
                await driver.wait(until.elementIsVisible(acceptButton), 8000);
                await driver.wait(until.elementIsEnabled(acceptButton), 8000);
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

        // 等待登入完成，檢查是否進入後台首頁
        console.log('4-登入後進到的地方(管理員會到後台/一般使用者到my-account');
        await takeScreenshot('4-登入後進到的地方.png');

        // 購物流程
        // 進入購物頁面 https://www.energyheart.com.tw/products/
        await driver.get('https://www.energyheart.com.tw/products/');
        console.log('5-1已進入購物頁面');
        await driver.sleep(5000); // 假設等待 5 秒鐘



        // 點擊「新航域合作專區」
        await driver.findElement(By.xpath('//div[contains(text(), "新航域合作專區")]')).click();
        console.log('5-2已點擊「新航域合作專區」');
        await takeScreenshot('5-2進入新航域合作專區.png');  // 截圖選擇專區
        
        // 選擇購買「....艙」
        
        const comboBuying = await new Promise((resolve) => {
            rl.question('您要買的套餐?(請輸入:豪華經典艙/能量商務艙/尊貴頭等艙):', resolve);
        });

        const comboName = comboBuying.trim();
        console.log('6-1您輸入的指定套餐為:', comboName);

        await driver.findElement(By.xpath(`//h2[contains(text(), "${comboName}")]`)).click();
        console.log(`6-2已選擇「${comboName}」`);
        await takeScreenshot(`6-2已選擇${comboName}.png`);  // 截圖選擇產品

        rl.close();

       // 加入購物車
        let addToCartButton = await driver.findElement(By.css('.single_add_to_cart_button'));
        await driver.wait(until.elementIsVisible(addToCartButton), 10000); // 等待元素可見
        await addToCartButton.click();
        await takeScreenshot('7-1-點選加入購物車.png');  // 截圖選擇產品
        console.log('7-1已加入購物車');
        await driver.sleep(5000); // 假設等待 5 秒鐘
        await takeScreenshot('7-2-可以查看購物車了.png');  // 截圖選擇產品
        
        // 進入購物車頁面
        await driver.get('https://www.energyheart.com.tw/checkout-2/');
        console.log('8-1已進入購物車頁面');
        await takeScreenshot('8-1-進入購物車頁面.png');

        // 假設這裡需要進行結帳的相關操作，例如選擇配送方式、填寫地址等
        await driver.sleep(9000);
        await takeScreenshot('8-2-讓購物車頁面跳轉後.png');
        console.log('8-2購物車頁面跳轉了');

        const testFirstName = '姓' + user_account;
        const testLastName = '名' + user_account;
        const testPhone ='0966520168';
        await driver.findElement(By.name('billing_first_name')).sendKeys(testFirstName);
        // await takeScreenshot('91-selected_product.png');
        await driver.findElement(By.name('billing_last_name')).sendKeys(testLastName);
        // await takeScreenshot('92-selected_product.png');
        await driver.findElement(By.name('billing_phone')).sendKeys(testPhone);
        await takeScreenshot('9-填完姓名電話後.png');
        console.log('9-填完姓名電話後');

        await driver.findElement(By.name('woocommerce_checkout_place_order')).click();
        console.log('9-1點選結帳按鈕, 準備並等待跳轉');
        await driver.sleep(15000);
        console.log('9-2跳轉成功-完成結帳-顯示訂單頁面');
        await takeScreenshot('9-2完成結帳-顯示訂單頁面.png');
        // 查找 <li> 标签中的 <strong> 子标签
        const strongElement = await driver.findElement(By.css('.woocommerce-order-overview__order.order strong'));
        const orderNumber = await strongElement.getText();
        console.log('10-取得訂單編號-', orderNumber);

        // 將結果保存到Excel
        const workbook = xlsx.utils.book_new();
        const worksheetData = [
        ['User Email', 'User Level', 'Purchased combo', 'orderNumber'],
        [user_account, userLevel, comboName, orderNumber, /* more data here */]
        ];
        const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Test Results');
        xlsx.writeFile(workbook, 'purchased_results.xlsx');
        console.log('寫入Excel檔案並輸出:', `${user_account}_purchased_results.xlsx`);
        console.log('完成結帳流程');
    } finally {
        // 關閉瀏覽器
        await driver.quit();
    }
})();
