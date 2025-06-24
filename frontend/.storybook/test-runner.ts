import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await page.goto('about:blank');
  },
  async postVisit(page) {
    const elementHandler = await page.$('#storybook-root');
    const innerHTML = await elementHandler?.innerHTML();
    expect(innerHTML).not.toBeNull();
  },
  tags: {
    skip: ['skip-test'],
  },
};

export default config;