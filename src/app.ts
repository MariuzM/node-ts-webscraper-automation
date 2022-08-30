import puppeteer from 'puppeteer';
import prompts from 'prompts';

type TypeGenres = { title: string; value: any };

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // =================================================================================================

  await page.goto('https://www.goodreads.com/choiceawards/best-books-2020', {
    waitUntil: 'networkidle2',
  });

  await Promise.all([
    page.click('.gcaButton'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  await page.evaluate(() => {
    const modal = document.querySelector('.modal__close > button') as HTMLButtonElement;
    modal.click();
  });

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

  await page.evaluate((id) => {
    document.querySelectorAll('.categoriesList__category')[id].querySelector('a')?.click();
  }, genreId);

  page.waitForNavigation({ waitUntil: 'networkidle2' });

  // =================================================================================================

  await page.goto('https://www.goodreads.com/choiceawards/best-historical-fiction-books-2020', {
    waitUntil: 'networkidle2',
  });

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

  // const randomBook = 'The Jane Austen Society by Natalie Jenner';

  await page.goto('https://www.amazon.com/');

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
