import path = require("path");
import { Browser, BrowserContext, chromium, firefox, webkit , Page } from "playwright";
import * as userData from "../data/login.cred.json";
import * as env from "../data/env.json";
import * as artworkData from "../data/artwork.json";
const browsers = [chromium,firefox,webkit];

browsers.forEach(browserType => {
    describe(`${browserType.name()} tests`, () => {

    let browser: Browser;
    let context: BrowserContext;
    let page: Page;
    const randomArtworkName="My artwork"+Math.floor(Math.random() * (100 - 0)) + 0+" "+`${browserType.name()}` ;
    jest.setTimeout(20000);

    beforeAll(async () => {
        browser = await browserType.launch({
            headless: false
        });
        context = await browser.newContext();
        page = await context.newPage();
      });


    test("login", async () => {
        await page.goto(env.baseUrl)
        await page.locator("//a[@href='/login']").click();
        await page.waitForLoadState('load');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        await page.getByPlaceholder("Enter Email Address").fill(userData.email);
        await page.getByPlaceholder("Enter Your Password").fill(userData.pass);
        await page.getByRole('button',{name: 'Login'}).click();

        await page.waitForLoadState('load');
        await page.waitForLoadState('domcontentloaded');
         await expect(page.url()).toBe("https://alt-art-frontend-staging.vercel.app/login");
        await page.waitForTimeout(5000);
    })

    test("Create new artwork", async () => {

         await page.waitForTimeout(2000);
        await page.locator("//a[@href='/artworks']/span[@id='artworks' and text()='Artworks']").last().click();
        await page.waitForTimeout(2000);
        expect(page.url()).toBe("https://alt-art-frontend-staging.vercel.app/artworks");

         await page.locator("//a[@href='/artworks/create']").click();

        //enter artwork name
        await page.locator("//input[@id='artwork_name']").fill(randomArtworkName);
    
        //enter edition type
        await selectRandomItem("//span[text()='Select Edition Type']", "//ul[@role='listbox']/li")

        const editionType= await page.locator("//span[@class='block truncate']").innerText();
        // if edition type is multiple then enter edition_number
        if(editionType==="Multiple Edition"){
            const numberOfEditions=await page.locator("//input[@id='edition_number']");
            expect(numberOfEditions).not.toBeNull();
            expect(await numberOfEditions?.isVisible()).toBe(true);
            await numberOfEditions.fill(artworkData.numberOfEditions);
        }

        await page.locator("//input[@id='edition_number']");
        //enter description
        await page.locator("//div[@data-placeholder='Text here...']").fill(artworkData.description);
        //enter current price
        await page.locator("//input[@name='current_price']").fill(artworkData.currentPrice);
        //enter primary_sale_price
        await page.locator("//input[@id='primary_sale_price']").fill(artworkData.primarySalePrice);
        //enter currency
        await selectRandomItem("//input[@id='react-select-3-input']", "//div[@id='react-select-3-listbox']/div")
        //enter style of artwork
        await selectRandomItem("//input[@id='react-select-4-input']", "//div[@id='react-select-4-listbox']/div")
        //enter NFT Genesis
        await selectRandomItem("//input[@id='react-select-5-input']", "//div[@id='react-select-5-listbox']/div")
        //enter Supply
        await selectRandomItem("//input[@id='react-select-6-input']", "//div[@id='react-select-6-listbox']/div")
        //enter random day from enabled dates in created on
        const btn = await page.waitForSelector("//p[text()='Created On *']/following-sibling::button");
        await btn?.click();
        const enabledDates = await page.$$(
            "//table[@role='grid']/tbody/tr/td/button[@name='day' and not(@disabled)]"
          );
        const randomDateButton = enabledDates[Math.floor(Math.random() * enabledDates.length)];
        await randomDateButton.click();
        await btn?.click();
        //enter artist royalty
         const ArtistRoyalty = await page.$$(
             "//p[text()='Artist Royalty *']/following-sibling::div/label/input"
           );
        const randomRoyalty = ArtistRoyalty[Math.floor(Math.random() * ArtistRoyalty.length)];
        await randomRoyalty.click();
        //upload image
        await page.setInputFiles("input[type='file']", path.join(__dirname, 'example.jpeg'));
        await page.waitForTimeout(2000);

        //Publish the artwork
        const publishButton=page.locator("//button[text()='Publish']");
        expect(publishButton).not.toBeNull();
        await page.waitForTimeout(2000);
        expect(await publishButton?.isEnabled()).toBe(true);
        await publishButton.click();
        await page.waitForTimeout(4000);
        //verify successfully created toast message
        await verifyToastMessage(page, "//div[@role='status']",'Your artwork is uploaded successfully.')
        await page.waitForTimeout(2000);
            

        })

    test("Write review", async () => {

    await page.getByText(randomArtworkName).click();
    await page.getByRole('tab', { name: 'Reviews' }).click();
    await page.waitForTimeout(2000);       
    //Enter review title   
    page.locator("//input[@id='review-title' and @name='title']").fill(artworkData.reviewTitle);
    await page.waitForTimeout(2000);     
    //Enter review details
    page.locator("//textarea[@name='detail']").fill(artworkData.reviewBody);
    //Submit review
    page.locator("//textarea/following-sibling::button[@type='submit']").click();
    await page.waitForTimeout(2000);  
    await verifyToastMessage(page, "//div[@role='status']",'Review Created!')
    })

    async function selectRandomItem(inputSelector:string, listboxSelector:string) {
      
        await page.locator(inputSelector).click({force:true});
      
        // Get all items in the dropdown
        const items = await page.$$(listboxSelector);
      
        // Generate a random index
        const randomIndex = Math.floor(Math.random() * items.length);
      
        // Select the item at the random index
        const randomItem = items[randomIndex];
      
        // Click on the random item (or perform other actions)
        await randomItem.click();

      }

      async function verifyToastMessage(page:Page, toastSelector: string, expectedText: string) {
        // Wait for the toast to appear
        await page.waitForSelector(toastSelector);
      
        // Get the text content of the toast element
        const toastText = await page.$eval(toastSelector, (element) => element.textContent);
        expect(toastText).toBe(expectedText);
      }
      
    afterAll(async () => {
        await page.close()
        await context.close()
        await browser.close()
    })
})
})