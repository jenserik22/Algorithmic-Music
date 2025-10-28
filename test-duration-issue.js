// Quick test to reproduce duration bug
import { EnhancedHelixEngine } from './src/lib/music/engines/enhanced-helix.ts';

const params = {
  seed: 12345,
  durationSecs: 16,
  bpm: 120,
  key: 'C',
  timeSignature: '4/4',
  density: 0.7,
  style: 'edm'
};

console.log('Generating 16 seconds of EDM music...');
console.log('Parameters:', JSON.stringify(params, null, 2));

const output = EnhancedHelixEngine.generate(params);

console.log('\n=== RESULTS ===');
console.log('Total events:', output.events.length);
console.log('Duration requested:', params.durationSecs, 'seconds');

if (output.events.length > 0) {
  const maxTime = Math.max(...output.events.map(e => e.time + e.duration));
  console.log('Actual duration:', maxTime.toFixed(3), 'seconds');
  console.log('Difference:', (maxTime - params.durationSecs).toFixed(3), 'seconds');
  
  if (maxTime > params.durationSecs) {
    console.log('\n❌ DURATION BUG CONFIRMED!');
    console.log('Events extending past requested duration:');
    const overflow = output.events.filter(e => e.time >= params.durationSecs || (e.time + e.duration) > params.durationSecs);
    overflow.slice(0, 10).forEach(e => {
      console.log(`  - ${e.track}: time=${e.time.toFixed(3)}s, duration=${e.duration.toFixed(3)}s, end=${(e.time + e.duration).toFixed(3)}s`);
    });
  } else {
    console.log('\n✅ Duration is correct!');
  }
  
  // Check tracks
  const tracks = [...new Set(output.events.map(e => e.track))];
  console.log('\nTracks generated:', tracks.join(', '));
} else {
  console.log('❌ No events generated!');
}
