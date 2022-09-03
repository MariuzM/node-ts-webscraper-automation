import inquirer from 'inquirer';
import prompts from 'prompts';
import puppeteer from 'puppeteer';

import type { TypeGenres } from './types/typesGeneral';

const links = {
  link1_main: 'https://www.goodreads.com/',
  link1: 'https://www.goodreads.com/choiceawards/best-books-2020',
  link2: 'https://www.amazon.com/',
};

const ui = new inquirer.ui.BottomBar();

(async () => {
  ui.log.write('Something just happened.');
  ui.log.write('Almost over, standby!');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // =================================================================================================

  await page.goto(links.link1, { waitUntil: 'networkidle2' });

  ui.updateBottomBar('Loading...');

  await Promise.all([
    page.click('.gcaButton'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  await page.evaluate(() => {
    const modal = document.querySelector('.modal__close > button') as HTMLButtonElement;
    modal.click();
  });

  // =================================================================================================
  // Get all genres for 2020
  // =================================================================================================

  const listGenres: TypeGenres[] = await page.evaluate(() => {
    const newArr: TypeGenres[] = [];
    const arrFromEl = document.querySelectorAll('.categoriesList__category');

    for (const [idx, el] of arrFromEl.entries()) {
      const t1 = el.querySelector('a');
      if (t1 && t1.firstChild && t1.firstChild.textContent) {
        newArr.push({ title: t1.firstChild.textContent.replace(/\n/g, ''), value: idx });
      }
    }

    return newArr;
  });

  const { genre: genreId } = await prompts({
    type: 'select',
    name: 'genre',
    message: 'Choose Genre',
    choices: listGenres,
  });

  const linkList = await page.$$eval('.categoriesList__category a', (el) =>
    el.map((a) => a.getAttribute('href'))
  );

  await page.goto(links.link1_main + linkList[genreId], {
    waitUntil: 'networkidle2',
  });

  // =================================================================================================
  // Chose random book
  // =================================================================================================

  const randomBook = await page.evaluate(() => {
    const newArr: string[] = [];
    const arrFromEl = document.querySelectorAll('.pollAnswer__bookLink');

    for (const el of arrFromEl) {
      const t1 = el.querySelector('img');
      if (t1) {
        newArr.push(t1?.getAttribute('alt') as string);
      }
    }

    return newArr[Math.floor(Math.random() * newArr.length)];
  });

  // =================================================================================================
  // Navigate to Amazon to the selected book and add to basket
  // =================================================================================================

  await page.goto(links.link2);

  await page.evaluate((randomBook) => {
    const input = document.querySelector('.nav-search-field > input') as HTMLInputElement;
    input.click();
    input.value = randomBook;
    const submit = document.querySelector('.nav-search-submit-text > input') as HTMLInputElement;
    submit.click();
  }, randomBook);

  await page.waitForNavigation();

  await page.evaluate(() => {
    const div = document.querySelectorAll(
      "div[data-component-type='s-search-result']"
    )[0] as HTMLDivElement;

    const img = div.querySelector('img');
    img?.click();
  });

  await page.waitForNavigation();

  await page.evaluate(() => {
    const oneClickBuy = document.querySelector('#one-click-button') as HTMLDivElement;
    const buyNow = document.querySelector('#buy-now-button') as HTMLDivElement;

    if (oneClickBuy) oneClickBuy.click();
    if (buyNow) buyNow.click();
  });

  // =================================================================================================
  // Amazon Auth
  // =================================================================================================

  const { email } = await prompts({
    type: 'text',
    name: 'email',
    message: 'Enter email',
  });

  await page.evaluate((val) => {
    const input = document.querySelector("input[type='email']") as HTMLInputElement;
    input.click();
    input.value = val;
    const btn = document.querySelector("input[id='continue']") as HTMLInputElement;
    btn.click();
  }, email);

  await page.waitForNavigation();

  const { password } = await prompts({
    type: 'password',
    name: 'password',
    message: 'Enter password',
  });

  await page.evaluate(async (val) => {
    const input = document.querySelector("input[type='password']") as HTMLInputElement;
    input.click();
    input.value = val;

    const btn = document.querySelector("input[id='signInSubmit']") as HTMLInputElement;
    btn.click();

    // const skip = document.querySelector(
    //   "a[id='ap-account-fixup-phone-skip-link']"
    // ) as HTMLInputElement;
    // skip.click();
  }, password);

  // await browser.close();
})();
