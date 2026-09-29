// 知闲 · 省/市(/区) 인라인 선택 (회원가입·글쓰기). showDistrict면 广州 등에서 区 표시
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Brand, F, R, S } from '@/constants/brand';
import { PROVINCES, citiesOf, districtsOf } from '@/constants/regions';

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
  const cities = citiesOf(province);
  const districts = showDistrict ? districtsOf(city) : [];

  return (
    <View style={{ gap: S.sm }}>
      <Text style={styles.sub}>省</Text>
      <View style={styles.box}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.row}
          {...(Platform.OS === 'web' ? ({ dataSet: { thinbar: 'prov' } } as any) : {})}>
          {PROVINCES.map((p) => {
            const on = p.name === province;
            return (
              <Pressable
                key={p.name}
                onPress={() => {
                  const nc = citiesOf(p.name);
                  onChange(p.name, nc[0] ?? '', '');
                }}
                style={[styles.chip, on ? styles.on : styles.off]}>
                <Text style={[styles.chipText, { color: on ? '#fff' : Brand.text }]}>{p.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Text style={styles.sub}>市</Text>
      <View style={styles.box}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.row}
          {...(Platform.OS === 'web' ? ({ dataSet: { thinbar: 'city' } } as any) : {})}>
          {cities.map((c) => {
            const on = c === city;
            return (
              <Pressable
                key={c}
                onPress={() => onChange(province, c, '')}
                style={[styles.chip, on ? styles.on : styles.off]}>
                <Text style={[styles.chipText, { color: on ? '#fff' : Brand.text }]}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {districts.length > 0 && (
        <>
          <Text style={styles.sub}>区 (选填)</Text>
          <View style={styles.box}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              contentContainerStyle={styles.row}
              {...(Platform.OS === 'web' ? ({ dataSet: { thinbar: 'dist' } } as any) : {})}>
              <Pressable
                onPress={() => onChange(province, city, '')}
                style={[styles.chip, district === '' ? styles.on : styles.off]}>
                <Text style={[styles.chipText, { color: district === '' ? '#fff' : Brand.text }]}>不限</Text>
              </Pressable>
              {districts.map((d) => {
                const on = d === district;
                return (
                  <Pressable
                    key={d}
                    onPress={() => onChange(province, city, d)}
                    style={[styles.chip, on ? styles.on : styles.off]}>
                    <Text style={[styles.chipText, { color: on ? '#fff' : Brand.text }]}>{d}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { fontSize: F.small, color: Brand.textSub, fontWeight: '600' },
  box: { height: 50 },
  row: { flexDirection: 'row', gap: S.sm, alignItems: 'flex-start', paddingRight: S.lg },
  chip: {
    paddingHorizontal: S.lg,
    height: 38,
    borderRadius: R.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  on: { backgroundColor: Brand.green },
  off: { backgroundColor: '#E7EAEC' },
  chipText: { fontSize: F.small, fontWeight: '700', lineHeight: 20, includeFontPadding: false },
});
