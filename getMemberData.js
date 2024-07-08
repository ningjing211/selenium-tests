const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const xlsx = require('xlsx');

// 設置 readline 接口
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
// });

async function getMemberData(file_name) {
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
        const screenshotsDir = path.join(__dirname, 'screenshots-getMemberData');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }

        let image = await driver.takeScreenshot();
        fs.writeFileSync(path.join(screenshotsDir, filename), image, 'base64');
    }

    // function getMemberInfo(filename) {
    //     try {
    //         const filePath = path.join(__dirname, filename);
    //         const workbook = xlsx.readFile(filePath);
    //         const sheetName = workbook.SheetNames[0];
    //         const worksheet = workbook.Sheets[sheetName];
            
    //         // 將工作表轉換為 JSON 格式
    //         const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    //         // 假設訂單編號在第二行第四列（A1, B1, C1, D1）
    //         const memberInfo = data; // [1] 是第二行，[3] 是第四列
    //         return memberInfo;
    //     } catch (error) {
    //         console.error('Error reading Excel file:', error);
    //         return null;
    //     }
    // }

    try {

        console.log('Member Orign已辦完, 準備傳送給MemberSecond的陌生帳號, 讓陌生帳號點擊Member Origin的連結');
        // 打開 WordPress 登入頁面
        console.log('準備登入MemberOrigin的帳號,分別存取儲值金, 分潤金, 分享連結的值');
        await driver.get('https://www.energyheart.com.tw/wp-login.php');
        console.log('已打開登入頁面');
        await takeScreenshot('1-已打開登入頁面.png');

        // 等待登入表單元素顯示
        await driver.wait(until.elementLocated(By.id('user_login')), 30000);

        // 填寫登入表單
        const filename = file_name;
        const filePath = path.join(__dirname, filename);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 將工作表轉換為 JSON 格式
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        // 假設訂單編號在第二行第四列（A1, B1, C1, D1）
        // [1] 是第二行，[3] 是第四列

        let user_email = data[1][0];  // 帳號
        let user_level = data[1][1];  // email
        let user_order = data[1][3]; // orderNumber
        let credit = data[1][4];  // credit 儲值金
        let dividend = data[1][5];  // divident 分潤金
        let share_link = data[1][6]; // shareLink 分享連結
        console.log(data[1]);
        console.log('此帳號為:', user_email);
        console.log('用戶為:', user_level);
        console.log('訂單編號:', user_order);
        console.log('儲值金尚有:', credit);
        console.log('分潤金尚有', dividend);
        console.log('分享連結', share_link);

        await driver.findElement(By.id('user_login')).sendKeys(user_email);
        await driver.findElement(By.id('user_pass')).sendKeys(user_email);
        await driver.findElement(By.id('wp-submit')).click();
        console.log('已提交登入表單');
        await takeScreenshot('2-已提交登入表單.png');
        

        // 等待直到元素可見並取得其值
        let shareUrlInput = await driver.findElement(By.id('share_url'));
        let shareUrlValue = await shareUrlInput.getAttribute('value');

        // 等待 class 為 mycred-my-balance-wrapper 的元素可見
        await driver.wait(until.elementLocated(By.className('mycred-my-balance-wrapper')), 5000);
        // 找到所有 <th> 子元素
        const elements = await driver.findElements(By.css('th > div.mycred-my-balance-wrapper'));
        let elementsText = [];
        for (let element of elements) {
            elementsText.push(element);
        }

        let values = [];
        for (let element of elementsText) {
            let divElement = await element.findElement(By.css('div'));
            let textValue = await divElement.getText();
            values.push(textValue);
        }


        console.log('儲值金:', values[0]); 
        console.log('分潤金:', values[1]); 
        console.log('分享連結的值:', shareUrlValue);

        credit = values[0];
        dividend = values[1];
        share_link = shareUrlValue;
        user_order = '5080';

        //還要把位址指定回去
        data[1][3] = user_order;
        data[1][4] = credit;  // credit 儲值金
        data[1][5]= dividend;  // divident 分潤金
        data[1][6]= share_link; // shareLink 分享連結

        // 將更新後的資料寫回 Excel 檔案
        const updatedSheet = xlsx.utils.aoa_to_sheet(data);
        workbook.Sheets[sheetName] = updatedSheet;
        console.log(data[1]);
        // 將更新後的 Excel 檔案寫入到磁碟
        xlsx.writeFile(workbook, filePath);
        console.log('成功更新檔案並寫入Excel');

    } catch (error) {
        console.error('出現錯誤:', error);
        await takeScreenshot('error.png');
    } finally {
        // 關閉瀏覽器
        await driver.quit();
    }
};

module.exports = getMemberData;