require('dotenv').config();
const { generateTip } = require('../src/utils/content');

async function testGrokTip() {
    console.log('[TEST] Generating Grok tip...');

    try {
        const focus = 'healing';
        const gender = 'male';

        const tip = await generateTip(focus, gender);
        console.log('\n✅ Sample Grok Tip:\n');
        console.log(tip);
        console.log('\n✅ If this is not good enough, we will improve the prompt structure.\n');
    } catch (err) {
        console.error('[TEST] Error generating Grok tip:', err);
    }
}

testGrokTip();