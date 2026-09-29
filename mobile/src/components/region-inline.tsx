// 知闲 · 省/市/区 셀렉트 박스(캐스케이딩 드롭다운) — 한 줄 배치
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, F, R, S } from '@/constants/brand';
import { PROVINCES, citiesOf, districtsOf } from '@/constants/regions';

type Level = 'prov' | 'city' | 'dist' | null;

export default function RegionInline({
  province,
  city,
  district = '',
  showDistrict = false,
  onChange,
}: {
  province: string;
  city: string;
  district?: string;
  showDistrict?: boolean;
  onChange: (province: string, city: string, district: string) => void;
}) {
  const [open, setOpen] = useState<Level>(null);
  const cities = citiesOf(province);
  const districts = showDistrict ? districtsOf(city) : [];

  let title = '';
  let options: string[] = [];
  let current = '';
  if (open === 'prov') {
    title = '选择省';
    options = PROVINCES.map((p) => p.name);
    current = province;
  } else if (open === 'city') {
    title = '选择市';
    options = cities;
    current = city;
  } else if (open === 'dist') {
    title = '选择区';
    options = ['不限', ...districts];
    current = district || '不限';
  }

  function choose(v: string) {
    if (open === 'prov') {
      const nc = citiesOf(v);
      onChange(v, nc[0] ?? '', '');
    } else if (open === 'city') {
      onChange(province, v, '');
    } else if (open === 'dist') {
      onChange(province, city, v === '不限' ? '' : v);
    }
    setOpen(null);
  }

  const Box = ({ label, val, onPress }: { label: string; val: string; onPress: () => void }) => (
    <View style={styles.col}>
      <Text style={styles.cap}>{label}</Text>
      <Pressable style={styles.box} onPress={onPress}>
        <Text style={styles.boxVal} numberOfLines={1}>
          {val || '—'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Brand.textSub} />
      </Pressable>
    </View>
  );

  return (
    <View>
      <View style={styles.row}>
        <Box label="省" val={province} onPress={() => setOpen('prov')} />
        <Box label="市" val={city} onPress={() => setOpen('city')} />
        {showDistrict && districts.length > 0 && (
          <Box label="区 (选填)" val={district || '不限'} onPress={() => setOpen('dist')} />
        )}
      </View>

      <Modal visible={open !== null} transparent animationType="slide" onRequestClose={() => setOpen(null)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(null)} />
          <View style={styles.sheet}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.sheetBar}>
                <Text style={styles.sheetTitle}>{title}</Text>
                <Pressable onPress={() => setOpen(null)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={Brand.text} />
                </Pressable>
              </View>
              <ScrollView style={{ maxHeight: 380 }}>
                {options.map((o) => {
                  const on = o === current;
                  return (
                    <Pressable key={o} style={styles.opt} onPress={() => choose(o)}>
                      <Text style={[styles.optText, on && styles.optOn]}>{o}</Text>
                      {on && <Ionicons name="checkmark" size={18} color={Brand.green} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: S.sm },
  col: { flex: 1, gap: 4 },
  cap: { fontSize: F.tiny, color: Brand.textSub, fontWeight: '600' },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    height: 46,
    backgroundColor: '#fff',
  },
  boxVal: { flex: 1, fontSize: F.body, color: Brand.text, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Brand.card, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl },
  sheetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: S.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  sheetTitle: { fontSize: F.h2, fontWeight: '800', color: Brand.text },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  optText: { fontSize: F.body, color: Brand.text },
  optOn: { color: Brand.green, fontWeight: '800' },
});
