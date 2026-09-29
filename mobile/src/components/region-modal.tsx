// 知闲 · 도시 선택 모달 (홈 상단)
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { PROVINCES, citiesOf } from '@/constants/regions';

export default function RegionModal({
  visible,
  province,
  city,
  onClose,
  onSelect,
  allowAll = false,
}: {
  visible: boolean;
  province: string;
  city: string;
  onClose: () => void;
  onSelect: (province: string, city: string) => void;
  allowAll?: boolean;
}) {
  const [prov, setProv] = useState(province);
  const cities = citiesOf(prov);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.bar}>
              <Text style={styles.title}>选择城市</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={Brand.text} />
              </Pressable>
            </View>
            {allowAll && (
              <Pressable
                onPress={() => {
                  onSelect('', '');
                  onClose();
                }}
                style={[styles.allBtn, !city && styles.allBtnOn]}>
                <Ionicons name="globe-outline" size={18} color={!city ? '#fff' : Brand.greenDark} />
                <Text style={[styles.allText, !city && styles.allTextOn]}>全部城市（不限）</Text>
              </Pressable>
            )}
            <View style={styles.body}>
              {/* 省 */}
              <ScrollView style={styles.provCol} showsVerticalScrollIndicator={false}>
                {PROVINCES.map((p) => {
                  const on = p.name === prov;
                  return (
                    <Pressable key={p.name} onPress={() => setProv(p.name)} style={[styles.provItem, on && styles.provItemOn]}>
                      <Text style={[styles.provText, on && styles.provTextOn]}>{p.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {/* 市 */}
              <ScrollView style={styles.cityCol} contentContainerStyle={styles.cityWrap} showsVerticalScrollIndicator={false}>
                {cities.map((c) => {
                  const on = prov === province && c === city;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => {
                        onSelect(prov, c);
                        onClose();
                      }}
                      style={[styles.cityChip, on && styles.cityChipOn]}>
                      <Text style={[styles.cityText, on && styles.cityTextOn]}>{c}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Brand.card, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, maxHeight: '75%' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: S.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  title: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  allBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    marginHorizontal: S.lg,
    marginTop: S.md,
    paddingVertical: 12,
    paddingHorizontal: S.lg,
    borderRadius: R.md,
    backgroundColor: Brand.greenSoft,
  },
  allBtnOn: { backgroundColor: Brand.green },
  allText: { fontSize: F.body, fontWeight: '800', color: Brand.greenDark },
  allTextOn: { color: '#fff' },
  body: { flexDirection: 'row', height: 380 },
  provCol: { width: 110, backgroundColor: Brand.bg },
  provItem: { paddingVertical: 14, paddingHorizontal: S.lg },
  provItemOn: { backgroundColor: Brand.card },
  provText: { fontSize: F.body, color: Brand.textSub },
  provTextOn: { color: Brand.green, fontWeight: '800' },
  cityCol: { flex: 1 },
  cityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, padding: S.lg },
  cityChip: { paddingHorizontal: S.lg, paddingVertical: 8, borderRadius: R.pill, backgroundColor: '#E7EAEC' },
  cityChipOn: { backgroundColor: Brand.green },
  cityText: { fontSize: F.small, fontWeight: '700', color: Brand.text },
  cityTextOn: { color: '#fff' },
});
