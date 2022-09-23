import { dummyTest } from './dummy';

test('dummy test', () => {
    expect(dummyTest('test')).toBe('test.');
});
