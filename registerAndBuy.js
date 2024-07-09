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
    // options.addArguments('--headless');  // 設置無頭模式
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

    async function clickAcceptButton() {
        try {
            await takeScreenshot('點選I-agree後.png');
            console.log('點選了我同意');
            await driver.wait(until.elementLocated(By.id('tpul-modal-btn-accept')), 20000); // 增加等待時間為 30 秒
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

    async function getExistedMemberLevel(filename) {
        try {
            const filePath = path.join(__dirname, filename);
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

            // 假設訂單編號在第二行第四列（A1, B1, C1, D1）
            const memberLevel = data[1][1]; // [1] 是第二行，[3] 是第四列
            return memberLevel;
        } catch (error) {
            console.error('Error reading Excel file:', error);
            return null;
        }
    }

    async function getCanBuyCombo (level){
        const canBuyArray = [];
        switch (level) {
            case "A級經銷商":
                canBuyArray.push('尊貴頭等艙');
                return canBuyArray;
            case "B級經銷商":
                canBuyArray.push('尊貴頭等艙', '能量商務艙');
                return canBuyArray;
            case "C級經銷商":
                canBuyArray.push('尊貴頭等艙', '能量商務艙', '豪華經典艙');
                return canBuyArray;
            default:
                return "未知"; // 或者可以根據需要返回其他預設值或處理方式
        }
    }

    try {
        
        let userLevel = '';

        const ifStranger = await new Promise((resolve) => {
            rl.question('--- 沒有上家的陌生客戶請按1, 經過上家分享連結的陌生客戶請按2, C級以上經銷商請按3 ---) ', resolve);
        });
        

        let linkFromUpper = '';
        let timestamp = '';
        let testEmail = '';
        let existedAccount = '';

        let existedMember = false;

        switch (ifStranger.trim()) {
            case '1':
                // 打開 WordPress 註冊頁面
                userLevel = 'Stranger';
                await driver.get('https://www.energyheart.com.tw/my-account/');
                console.log('已打開註冊頁面');
                await takeScreenshot('1-2-已打開註冊頁面.png');  // 截圖註冊頁面
                
                // 如果是要註冊新帳號的話
                // 等待註冊表單元素顯示，增加等待時間至 15 秒
                await driver.wait(until.elementLocated(By.id('reg_email')), 12000);
                // 填寫註冊表單
                timestamp = new Date().getTime().toString().slice(-5);  // 取得當前時間戳記 
                testEmail = `${timestamp}@surfman.com`;
                await driver.findElement(By.id('reg_email')).sendKeys(testEmail);  // 使用帳號格式為 timestamp + test_email@example.com
                console.log('已填寫註冊表單');
                await takeScreenshot('2-已填寫註冊表單.png');  // 截圖填寫完的註冊表單
                // 提交註冊表單
                await driver.findElement(By.name('register')).click();
                console.log('已提交註冊表單');
                // 等待註冊完成，檢查是否進入賬戶頁面
                await driver.wait(until.urlContains('my-account'), 12000);
                await takeScreenshot('3-註冊完成進入同意頁面.png');  // 截圖註冊後頁面
                
                // 點擊「接受」按鈕，如果有的話
                await clickAcceptButton();
                break; 
            case '2':
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
                await registerNewAccount();
                // 點擊「接受」按鈕，如果有的話
                await clickAcceptButton();
                break;
            default:
                existedAccount = await new Promise((resolve) => {
                    rl.question('現有C級以上經銷商?您的帳號為: ', resolve);
                });
                existedMember = true;
                // 打開 WordPress 登入頁面
                await driver.get('https://www.energyheart.com.tw/wp-login.php');
                console.log('已打開登入頁面');
                // 更改訂單狀態
                await driver.sleep(3000); // 添加延遲以確保上一步操作完成
                // 等待登入表單元素顯示
                await driver.wait(until.elementLocated(By.id('user_login')), 1000);
    
                // 填寫登入表單
                await driver.findElement(By.id('user_login')).sendKeys(existedAccount);
                await driver.findElement(By.id('user_pass')).sendKeys(existedAccount);
    
                // 提交登入表單
                await driver.findElement(By.id('wp-submit')).click();
                console.log('已提交登入表單');
    
                // 等待登入完成，檢查是否進入後台首頁
                await driver.wait(until.urlContains('my-account'), 2000);
                console.log('登入成功！');
                // 檢查是否存在接受按鈕
                const elements = await driver.findElements(By.id('tpul-modal-btn-accept'));
                if (elements.length > 0) {
                    await clickAcceptButton();  // 點擊「接受」按鈕
                } else {
                    console.log('沒有發現接受按鈕');
                }
                break;
        }

        
        // 模擬購物流程
        // 進入購物頁面 https://www.energyheart.com.tw/products/
        await driver.get('https://www.energyheart.com.tw/products/');
        console.log('已進入購物頁面');
        let comboBuying = ''
        if(!existedMember) {
            comboBuying = await new Promise((resolve) => {
            rl.question('您要買的套餐?(請輸入:豪華經典艙/能量商務艙/尊貴頭等艙):', resolve);
            });
        } else {

            const existedMemberLevel = await getExistedMemberLevel(`${existedAccount}_purchased_results.xlsx`);

            console.log('您的等級為:', existedMemberLevel);
            
            const canBuyOptions = await getCanBuyCombo(existedMemberLevel);

            console.log('您可以繼續購買:', canBuyOptions);
            comboBuying = await new Promise((resolve) => {
                rl.question('您可以繼續購買的套餐為?(請輸入:豪華經典艙/能量商務艙/尊貴頭等艙):', resolve);
            });

        }

        rl.close();
        
        // 點擊「新航域合作專區」
        await driver.sleep(5000); // 假設等待 5 秒鐘
        const productLink = "新航域合作專區";
        // Wait until the element is located and visible
        const element = await driver.wait(until.elementLocated(By.xpath(`//a[contains(@class, 'elementor-button') and .//span[contains(text(), "${productLink}")]]`)), 10000);
        await driver.wait(until.elementIsVisible(element), 5000);
        await element.click();

        console.log('已點擊「新航域合作專區」');
        await takeScreenshot('5-進入新航域合作專區.png');  // 截圖選擇專區
        
        // 選擇購買「xxx艙」
        const comboName = comboBuying;
        await driver.findElement(By.xpath(`//h2[contains(text(), "${comboName}")]`)).click();
        console.log(`已選擇${comboName}`);
        await takeScreenshot(`6-選擇${comboName}.png`);  // 截圖選擇產品
        
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
        if (!existedMember) {
            console.log('輸出這個新註冊的帳號:', testEmail);
            const workbook = xlsx.utils.book_new();
            const worksheetData = [
            ['user_email', 'user_Level', 'purchased_combo', 'orderNumber', 'credit', 'dividend', 'share_link'],
            [testEmail, userLevel, comboName, orderNumber, 0, 0, '' /* more data here */]
            ];
            const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Test Results');
            xlsx.writeFile(workbook, `${testEmail}_purchased_results.xlsx`);
            console.log('寫入Excel檔案並輸出:', `${testEmail}_purchased_results.xlsx`);
        } else {
            testEmail = existedAccount;
            console.log('輸出這個現存的會員帳號:', testEmail);
        }

        console.log('完成結帳流程');
        const admin = require('./admin');
        const changePassword = require('./changePassword');
        const getMemberData = require('./getMemberData');

        await admin(orderNumber, testEmail);
        if(!existedMember) {
            await changePassword(testEmail);
        }
        await getMemberData(`${testEmail}_purchased_results.xlsx`);
    } finally {
        // 關閉瀏覽器
        await driver.quit();
    }
})();
