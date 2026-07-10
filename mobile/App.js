import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { C } from './src/theme'
import DataEngineerScreen from './src/screens/DataEngineerScreen'
import PassengerScreen from './src/screens/PassengerScreen'
import StationManagerScreen from './src/screens/StationManagerScreen'

const TABS = [
  { id: 'de', label: 'Analytics', icon: 'stats-chart', screen: DataEngineerScreen },
  { id: 'passenger', label: 'Passenger', icon: 'person', screen: PassengerScreen },
  { id: 'manager', label: 'Operations', icon: 'construct', screen: StationManagerScreen },
]

function Shell() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState('de')
  const Active = TABS.find((t) => t.id === tab).screen

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.logo}>
          <Ionicons name="train" size={18} color={C.gold} />
        </View>
        <Text style={styles.brand}>
          RailSmart <Text style={styles.brandSub}>· UK Rail Intelligence</Text>
        </Text>
      </View>

      {/* Screen */}
      <View style={{ flex: 1 }}>
        <Active />
      </View>

      {/* Bottom tabs */}
      <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <Pressable key={t.id} style={styles.tab} onPress={() => setTab(t.id)}>
              <Ionicons name={active ? t.icon : `${t.icon}-outline`} size={22} color={active ? C.gold : C.ink45} />
              <Text style={[styles.tabLabel, { color: active ? C.gold : C.ink45 }]}>{t.label}</Text>
            </Pressable>
          )
        })}
      </View>

      <StatusBar style="light" />
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.panelBorder,
    backgroundColor: 'rgba(10,15,24,0.6)',
  },
  logo: { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(197,168,128,0.15)', alignItems: 'center', justifyContent: 'center' },
  brand: { color: C.ink, fontSize: 15, fontWeight: '700' },
  brandSub: { color: C.ink45, fontWeight: '400', fontSize: 12 },
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.panelBorder,
    backgroundColor: 'rgba(10,15,24,0.9)',
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
})
