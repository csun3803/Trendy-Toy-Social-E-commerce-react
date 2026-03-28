import { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { getAlbumList, getAlbumDetail } from '../services/albumService';
import type { AlbumItem } from '../types';
import { config } from '../config/index';

const BASE_URL = config.RESOURCE_BASE_URL;

const Tujian = () => {
  const [list, setList] = useState<AlbumItem[]>([]);
  const [filtered, setFiltered] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('全部');

  const letters = ['全部', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  const filterByLetter = (letter: string) => {
    setSelectedLetter(letter);
    if (letter === '全部') {
      setFiltered(list);
    } else {
      const filtered = list.filter(item => 
        item.name.toUpperCase().startsWith(letter)
      );
      setFiltered(filtered);
    }
  };

  const fetchAlbumList = async () => {
    setLoading(true);
    try {
      const response = await getAlbumList();
      if (response.code === 200) {
        const albumList = (response.data as unknown as any[]).map((item: any) => ({
          id: item.id,
          name: item.name,
          img: item.img
        }));
        setList(albumList);
        setFiltered(albumList);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const showDetail = async (item: AlbumItem) => {
    try {
      const response = await getAlbumDetail(item.id);
      if (response.code === 200) {
        const detail = response.data as unknown as { ipName: string; shortDescription: string };
        Alert.alert(detail.ipName, detail.shortDescription);
      }
    } catch (error) {
      console.error('获取详情失败:', error);
      Alert.alert(item.name, 'IP详情描述');
    }
  };

  const goBack = () => {
    router.push('/');
  };

  useEffect(() => {
    fetchAlbumList();
  }, []);

  return (
    <View style={styles.tujianPage}>
      <View style={styles.container}>
        <View style={styles.row1}>
          <TouchableOpacity style={styles.left1} onPress={goBack}>
            <Svg width={24} height={24} viewBox="0 0 1024 1024">
              <Path 
                d="M386.883999 503.495622L772.456682 117.888857A68.164533 68.164533 0 1 0 676.072032 21.504206L242.272941 455.303297a68.164533 68.164533 0 0 0 0 96.384651L676.072032 985.487039a68.164533 68.164533 0 0 0 96.38465-96.384651L386.918081 503.495622z" 
                fill="#FFF" 
              />
            </Svg>
            <Text style={styles.tTj}>图鉴</Text>
          </TouchableOpacity>
          <View style={styles.right1}>
            <Svg width={24} height={24} viewBox="0 0 1026 1024">
              <Path 
                d="M1010.346667 931.84L826.026667 750.933333c58.026667-78.506667 92.16-170.666667 92.16-276.48 0-252.586667-204.8-460.8-460.8-460.8C208.213333 13.653333 0 218.453333 0 474.453333c0 252.586667 204.8 460.8 460.8 460.8 116.053333 0 221.866667-44.373333 303.786667-116.053333l184.32 180.906667c17.066667 17.066667 44.373333 17.066667 64.853333-3.413334 17.066667-20.48 17.066667-47.786667-3.413333-64.853333z m-546.133334-78.506667C256 853.333333 81.92 686.08 81.92 474.453333c0-208.213333 167.253333-378.88 378.88-378.88 208.213333 0 378.88 167.253333 378.88 378.88 3.413333 211.626667-167.253333 378.88-375.466667 378.88z" 
                fill="#FFF" 
              />
            </Svg>
          </View>
        </View>
        <View style={styles.left2}>
          <Text style={styles.tIp}>IP选择</Text>
        </View>
      </View>
    <View style={styles.letterScrollContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.letterScroll}
        contentContainerStyle={styles.letterScrollContent}
      >
        {letters.map((letter) => (
          <TouchableOpacity
            key={letter}
            style={[
              styles.letterButton,
              selectedLetter === letter && styles.selectedLetterButton
            ]}
            onPress={() => filterByLetter(letter)}
          >
            <Text style={[
              styles.letterText,
              selectedLetter === letter && styles.selectedLetterText
            ]}>
              {letter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8069E1" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <ScrollView style={styles.page}>
          <View style={styles.grid}>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => showDetail(item)}
              >
                <Image
                  source={typeof item.img === 'string' ? { uri: item.img.startsWith('http') ? item.img : `${BASE_URL}${item.img}` } : item.img}
                  style={styles.img}
                  resizeMode="cover"
                />
                <Text style={styles.name}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tujianPage: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    backgroundColor: '#2D2152',
    paddingTop: 40,
    paddingBottom: 20,
  },
  row1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  left1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tTj: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  right1: {
    padding: 5,
  },
  left2: {
    paddingHorizontal: 15,
  },
  tIp: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  letterScrollContainer: {
    marginBottom: 5,
  },
  letterScroll: {
    marginTop: 10,
  },
  letterScrollContent: {
    paddingHorizontal: 15,
    gap: 8,
  },
  letterButton: {
    width: 53,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 1)',
    borderRadius: 3,
  },
  selectedLetterButton: {
    backgroundColor: '#8069E1',
  },
  letterText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  selectedLetterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  page: {
    flex: 1,
    padding: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '18%',
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  img: {
    width: '100%',
    height: 80,
  },
  name: {
    fontSize: 10,
    color: '#333',
    padding: 5,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default Tujian;