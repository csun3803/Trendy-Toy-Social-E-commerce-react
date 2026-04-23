import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config';
import { getCabinetList, getCabinetItems, createCabinet } from '@/services/cabinetService';
import type { Cabinet, CabinetItem } from '@/services/cabinetService';
import { Path } from 'react-native-svg';
import Svg from 'react-native-svg';

const BASE_URL = config.RESOURCE_BASE_URL;

interface CabinetWithItems extends Cabinet {
  items: CabinetItem[];
}

interface UserInfo {
  userId: string;
  username: string;
  avatar?: string;
}

const tabs = [
  { key: 'owned', label: '已拥有', count: 20 },
  { key: 'pending', label: '待发货', count: 4 },
  { key: 'mail', label: '待补邮', count: 2 },
  { key: 'balance', label: '待补尾款', count: 5 },
];

export default function CabinetScreen() {
  const [cabinets, setCabinets] = useState<CabinetWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState('owned');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCabinetName, setNewCabinetName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo?.userId) {
      fetchCabinets();
    }
  }, [userInfo]);

  const loadUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserInfo(parsed);
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  const fetchCabinets = async () => {
    try {
      setLoading(true);
      const response = await getCabinetList(userInfo!.userId);
      if (response.code === 200) {
        const cabinetList = response.data || [];
        const cabinetsWithItems: CabinetWithItems[] = [];
        
        for (const cabinet of cabinetList) {
          try {
            const itemsRes = await getCabinetItems(cabinet.cabinetId);
            if (itemsRes.code === 200) {
              cabinetsWithItems.push({
                ...cabinet,
                items: itemsRes.data || []
              });
            } else {
              cabinetsWithItems.push({
                ...cabinet,
                items: []
              });
            }
          } catch {
            cabinetsWithItems.push({
              ...cabinet,
              items: []
            });
          }
        }
        
        setCabinets(cabinetsWithItems);
      } else {
        Alert.alert('提示', response.message || '获取盒柜列表失败');
      }
    } catch (error) {
      console.error('获取盒柜列表失败', error);
      Alert.alert('错误', '获取盒柜列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCabinet = async () => {
    if (!newCabinetName.trim()) {
      Alert.alert('提示', '请输入柜子名称');
      return;
    }

    try {
      setCreating(true);
      const response = await createCabinet({
        cabinetName: newCabinetName.trim(),
        description: '',
        isPublic: 0,
        userId: userInfo!.userId
      });

      if (response.code === 200) {
        Alert.alert('成功', '创建成功');
        setCreateModalVisible(false);
        setNewCabinetName('');
        fetchCabinets();
      } else {
        Alert.alert('错误', response.message || '创建失败');
      }
    } catch (error) {
      console.error('创建盒柜失败', error);
      Alert.alert('错误', '创建盒柜失败');
    } finally {
      setCreating(false);
    }
  };

  const goToCabinetDetail = (cabinetId: string) => {
    router.push(`/cabinet/${cabinetId}`);
  };

  const renderCabinetCard = (cabinet: CabinetWithItems) => {
    const isEmpty = cabinet.items.length === 0;
    
    return (
      <TouchableOpacity 
        key={cabinet.cabinetId}
        style={styles.cabinetCard}
        onPress={() => goToCabinetDetail(cabinet.cabinetId)}
      >
        <Text style={styles.cabinetTitle}>{cabinet.cabinetName}</Text>
        
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>这个柜子还是空的哦，快去把它装满吧</Text>
            <TouchableOpacity 
              style={styles.addItemButton}
              onPress={() => goToCabinetDetail(cabinet.cabinetId)}
            >
              <Text style={styles.addItemButtonText}>添加物品</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.itemCount}>已收录 {cabinet.items.length}</Text>
            <View style={styles.itemGrid}>
              {cabinet.items.slice(0, 8).map((item, index) => {
                const imageUri = item.displayImage 
                  ? (item.displayImage.startsWith('http') ? item.displayImage : `${BASE_URL}${item.displayImage}`)
                  : item.productImage 
                    ? (item.productImage.startsWith('http') ? item.productImage : `${BASE_URL}${item.productImage}`)
                    : 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20toy%20figure&image_size=square';
                
                return (
                  <Image 
                    key={item.itemId || index}
                    source={{ uri: imageUri }}
                    style={styles.itemImage}
                  />
                );
              })}
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Svg width={24} height={24} viewBox="0 0 1024 1024">
            <Path 
              d="M386.883999 503.495622L772.456682 117.888857A68.164533 68.164533 0 1 0 676.072032 21.504206L242.272941 455.303297a68.164533 68.164533 0 0 0 0 96.384651L676.072032 985.487039a68.164533 68.164533 0 0 0 96.38465-96.384651L386.918081 503.495622z" 
              fill="#3C3C3C" 
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>我的展示柜</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
              <Svg width={23} height={23} viewBox="0 0 1026 1024">
                <Path 
                  d="M1010.346667 931.84L826.026667 750.933333c58.026667-78.506667 92.16-170.666667 92.16-276.48 0-252.586667-204.8-460.8-460.8-460.8C208.213333 13.653333 0 218.453333 0 474.453333c0 252.586667 204.8 460.8 460.8 460.8 116.053333 0 221.866667-44.373333 303.786667-116.053333l184.32 180.906667c17.066667 17.066667 44.373333 17.066667 64.853333-3.413334 17.066667-20.48 17.066667-47.786667-3.413333-64.853333z m-546.133334-78.506667C256 853.333333 81.92 686.08 81.92 474.453333c0-208.213333 167.253333-378.88 378.88-378.88 208.213333 0 378.88 167.253333 378.88 378.88 3.413333 211.626667-167.253333 378.88-375.466667 378.88z" 
                  fill="rgba(0,0,0,0.7)" 
                />
              </Svg>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => setCreateModalVisible(true)}>
            <svg
              t="1776320222629"
              className="icon"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="4787"
              width={25}
              height={25}
            >
              <path
                d="M554.76 549.889v341c0 26.51-21.491 48-48 48-26.51 0-48-21.49-48-48v-341H114.172c-26.51 0-48-21.49-48-48s21.49-48 48-48H458.76v-340c0-26.51 21.49-48 48-48s48 21.49 48 48v340h346.414c26.51 0 48 21.49 48 48s-21.49 48-48 48H554.76z"
                fill="#3C3C3C"
                p-id="4788"
              />
            </svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        <View style={styles.content}>
          {cabinets.map(renderCabinetCard)}
          
          {cabinets.length === 0 && (
            <View style={styles.noCabinets}>
              <Text style={styles.noCabinetsText}>还没有创建盒柜</Text>
              <TouchableOpacity style={styles.createCabinetButton} onPress={() => setCreateModalVisible(true)}>
                <Text style={styles.createCabinetButtonText}>创建盒柜</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>创建新柜子</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>柜子名称</Text>
              <TextInput
                style={styles.input}
                value={newCabinetName}
                onChangeText={setNewCabinetName}
                placeholder="请输入柜子名称"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setCreateModalVisible(false)}
                disabled={creating}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleCreateCabinet}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>创建</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE9FE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#EDE9FE',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#8B5CF6',
    fontWeight: '500',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  cabinetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  cabinetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  itemCount: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  addItemButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  addItemButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
    width: '100%',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  noCabinets: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noCabinetsText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  createCabinetButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createCabinetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
