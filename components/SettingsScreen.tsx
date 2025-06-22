// SettingsScreen.tsx の import部分に追加
import { testVibration } from '../utils/AudioPlayer';

// テストボタンの近くに以下を追加：

{/* バイブレーションテスト */}
<View style={styles.testSection}>
  <Text style={styles.testTitle}>🧪 Vibration Test</Text>
  
  <View style={styles.testButtons}>
    <TouchableOpacity
      style={[styles.testButton, { backgroundColor: '#3B82F6' }]}
      onPress={() => testVibration('beep_short')}
    >
      <Text style={styles.testButtonText}>Short Vibe</Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.testButton, { backgroundColor: '#10B981' }]}
      onPress={() => testVibration('beep_long')}
    >
      <Text style={styles.testButtonText}>Long Vibe</Text>
    </TouchableOpacity>
  </View>
</View>
