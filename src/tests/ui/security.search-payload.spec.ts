import { getRenderedXssPayload } from '@api-data-providers/injection.data';
import { UI_PATH_PRODUCTS } from '@utils/constants';
import { expect, test } from '../../ui/fixtures';

/**
 * security-baseline — REQ-SEC-10: a search term is rendered as text, never as markup.
 *
 * REQ-SEC-09 already proves the API returns nothing for these payloads. That is the
 * server branch. This is the branch it cannot reach: a value can be accepted and stored
 * safely and still execute the moment a page renders it.
 *
 * A black-box test cannot prove no script ran. What it can prove is the observable
 * consequences of one running — a dialog, a result built from the payload — did not
 * happen, and that the page rendered rather than breaking. That limit is recorded in the
 * test plan §5 rather than dressed up as proof.
 */
test.describe('security-baseline — a script payload in the search field', () => {
  test(
    'TC-24 script markup submitted as a search term does not execute',
    { tag: '@negative' },
    async ({ page, navigationPage, productsPage }) => {
      const payload = getRenderedXssPayload();
      const raisedDialogs: string[] = [];

      await test.step('GIVEN a guest on the products page, watching for dialogs', async () => {
        page.on('dialog', async (dialog) => {
          raisedDialogs.push(dialog.message());
          await dialog.dismiss();
        });
        await navigationPage.gotoPath(UI_PATH_PRODUCTS);
      });

      await test.step(`WHEN a ${payload.label} is submitted as the search term`, async () => {
        await productsPage.searchFor(payload.value);
      });

      await test.step('THEN the results page renders and nothing executed', async () => {
        await productsPage.assertSearchResultsPageRendered();
        await productsPage.assertNoSearchResultsRendered();
        expect(raisedDialogs, 'the payload must not run as script').toEqual([]);
      });
    },
  );
});
