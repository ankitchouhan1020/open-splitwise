/**
 * Splitwise web deep links (not API URLs).
 * @see https://dev.splitwise.com/ — expenses and groups open on secure.splitwise.com
 */

/** Open a single expense in the Splitwise web app. */
export function splitwiseExpenseUrl(splitwiseExpenseId: number): string {
  return `https://secure.splitwise.com/expenses/${splitwiseExpenseId}`;
}

/** Open a group in the Splitwise web app. */
export function splitwiseGroupUrl(splitwiseGroupId: number): string {
  return `https://secure.splitwise.com/groups/${splitwiseGroupId}`;
}

export const SPLITWISE_HOME_URL = "https://splitwise.com";
