import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createActivity, updateActivity, getActivityDetail } from '../../services/activityService';
import { config } from '../../config';

const BASE_URL = config.API_BASE_URL;

const activityTypes = [
  { key: '开箱', label: '开箱' },
  { key: '展示', label: '展示' },
  { key: '评测', label: '评测' },
  { key: '分享', label: '分享' },
];

export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activityType, setActivityType] = useState('开箱');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [currentAuditStatus, setCurrentAuditStatus] = useState<string>('');
  const [currentPublishStatus, setCurrentPublishStatus] = useState<string>('');
  const [auditNotes, setAuditNotes] = useState<string>('');

  useEffect(() => {
    if (isEdit && id) {
      fetchActivityDetail();
    }
  }, [id]);

  const fetchActivityDetail = async () => {
    setLoading(true);
    try {
      const response = await getActivityDetail(id as string);
      const data = response.data as any;
      setTitle(data.title || '');
      setContent(data.content || '');
      setActivityType(data.activityType || '开箱');
      setLocation(data.location || '');
      setCurrentAuditStatus(data.auditStatus || '');
      setCurrentPublishStatus(data.publishStatus || '');
      setAuditNotes(data.auditNotes || '');
      
      let imageList: string[] = [];
      try {
        const parsed = typeof data.imageList === 'string' ? JSON.parse(data.imageList) : data.imageList;
        if (Array.isArray(parsed)) {
          imageList = parsed.map((img: string) => {
            if (img && !img.startsWith('http')) {
              return `${config.RESOURCE_BASE_URL}${img}`;
            }
            return img;
          });
        }
      } catch (e) {
        imageList = [];
      }
      setImages(imageList);
    } catch (error) {
      console.error('获取动态详情失败:', error);
      Alert.alert('错误', '获取动态详情失败');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= 9) {
      Alert.alert('提示', '最多只能上传9张图片');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限被拒绝', '需要访问相册权限来选择图片');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 9 - images.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败，请重试');
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (coverIndex >= newImages.length) {
      setCoverIndex(Math.max(0, newImages.length - 1));
    }
  };

  const setCover = (index: number) => {
    setCoverIndex(index);
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    const token = await AsyncStorage.getItem('token');

    for (const imageUri of images) {
      if (imageUri.startsWith('http')) {
        uploadedUrls.push(imageUri.replace(config.RESOURCE_BASE_URL, ''));
        continue;
      }

      try {
        let formData: FormData;
        
        if (Platform.OS === 'web') {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData = new FormData();
          formData.append('file', blob, 'image.jpg');
        } else {
          formData = new FormData();
          formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'image.jpg',
          } as any);
        }

        const uploadResponse = await fetch(`${BASE_URL}/upload/activity`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await uploadResponse.json();
        if (data.code === 200) {
          uploadedUrls.push(data.data.url);
        }
      } catch (error) {
        console.error('上传图片失败:', error);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入标题');
      return;
    }

    if (!content.trim()) {
      Alert.alert('提示', '请输入内容');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      const publishStatus = isDraft ? 'draft' : 'published';

      const activityData: any = {
        title: title.trim(),
        content: content.trim(),
        activityType,
        location: location.trim(),
        coverImage: imageUrls[coverIndex] || '',
        imageList: JSON.stringify(imageUrls),
        publishStatus,
      };

      if (isEdit) {
        activityData.activityId = id;
        if (!isDraft && (currentAuditStatus === '审核拒绝' || currentPublishStatus === 'draft')) {
          activityData.auditStatus = '待审核';
          activityData.auditNotes = '';
        }
        if (isDraft) {
          activityData.auditStatus = '';
          activityData.auditNotes = '';
        }
        await updateActivity(activityData);
        Alert.alert('成功', isDraft ? '已保存为草稿' : '动态已提交审核', [
          { text: '确定', onPress: () => router.back() }
        ]);
      } else {
        await createActivity(activityData);
        Alert.alert('成功', isDraft ? '草稿保存成功' : '动态已提交审核', [
          { text: '确定', onPress: () => router.replace('/my-activity') }
        ]);
      }
    } catch (error) {
      console.error('提交失败:', error);
      Alert.alert('错误', '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8069E1" />
      </View>
    );
  }

  const getStatusText = () => {
    if (!isEdit) return '';
    if (currentPublishStatus === 'draft') return '编辑中';
    if (currentAuditStatus === '待审核') return '审核中';
    if (currentAuditStatus === '审核通过') return '审核通过';
    if (currentAuditStatus === '审核拒绝') return '审核未通过';
    return '编辑中';
  };

  const getStatusColor = () => {
    if (!isEdit) return '#999';
    if (currentPublishStatus === 'draft') return '#FF9800';
    if (currentAuditStatus === '待审核') return '#2196F3';
    if (currentAuditStatus === '审核通过') return '#4CAF50';
    if (currentAuditStatus === '审核拒绝') return '#F44336';
    return '#FF9800';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#333" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isEdit ? '编辑动态' : '发布动态'}</Text>
          {isEdit && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.publishButton} 
          onPress={() => handleSubmit(false)}
          disabled={submitting}
        >
          <Text style={styles.publishButtonText}>
            {currentAuditStatus === '审核拒绝' ? '重新提交' : '发布'}
          </Text>
        </TouchableOpacity>
      </View>

      {isEdit && currentAuditStatus === '审核拒绝' && auditNotes ? (
        <View style={styles.rejectNotice}>
          <View style={styles.rejectNoticeHeader}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="#F44336" />
            </Svg>
            <Text style={styles.rejectNoticeTitle}>审核未通过</Text>
          </View>
          <Text style={styles.rejectNoticeReason}>原因：{auditNotes}</Text>
          <Text style={styles.rejectNoticeTip}>请修改后重新提交</Text>
        </View>
      ) : null}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.typeContainer}>
          <Text style={styles.label}>动态类型</Text>
          <View style={styles.typeList}>
            {activityTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[styles.typeItem, activityType === type.key && styles.typeItemActive]}
                onPress={() => setActivityType(type.key)}
              >
                <Text style={[styles.typeItemText, activityType === type.key && styles.typeItemTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="请输入标题"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
          <Text style={styles.charCount}>{title.length}/50</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.contentInput}
            placeholder="分享你的潮玩故事..."
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={styles.charCount}>{content.length}/2000</Text>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.label}>添加图片（最多9张）</Text>
          <View style={styles.imageList}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <TouchableOpacity 
                  style={styles.imageItem}
                  onPress={() => setCover(index)}
                >
                  <Image source={{ uri }} style={styles.image} />
                  {index === coverIndex && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverText}>封面</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24">
                    <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#fff" />
                  </Svg>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 9 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Svg width={32} height={32} viewBox="0 0 24 24">
                  <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#999" />
                </Svg>
                <Text style={styles.addImageText}>添加图片</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>位置</Text>
          <TextInput
            style={styles.locationInput}
            placeholder="添加位置信息（选填）"
            placeholderTextColor="#999"
            value={location}
            onChangeText={setLocation}
            maxLength={50}
          />
        </View>

        {isEdit && currentAuditStatus === '待审核' ? (
          <View style={styles.auditNotice}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#2196F3" />
            </Svg>
            <Text style={styles.auditNoticeText}>此动态正在审核中，修改后将重新提交审核</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          style={styles.draftButton} 
          onPress={() => handleSubmit(true)}
          disabled={submitting}
        >
          <Text style={styles.draftButtonText}>
            {isEdit && currentAuditStatus !== '待审核' ? '保存为草稿' : '保存为草稿'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {submitting && (
        <View style={styles.submittingOverlay}>
          <ActivityIndicator size="large" color="#8069E1" />
          <Text style={styles.submittingText}>提交中...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBack: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  publishButton: {
    backgroundColor: '#8069E1',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  typeContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 10,
  },
  typeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    marginBottom: 10,
  },
  typeItemActive: {
    backgroundColor: '#8069E1',
  },
  typeItemText: {
    fontSize: 14,
    color: '#666',
  },
  typeItemTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 0,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contentInput: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    minHeight: 150,
    padding: 0,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  imageItem: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#8069E1',
    paddingVertical: 2,
  },
  coverText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  locationInput: {
    fontSize: 15,
    color: '#333',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  draftButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  draftButtonText: {
    fontSize: 15,
    color: '#666',
  },
  rejectNotice: {
    backgroundColor: '#FFF5F5',
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  rejectNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  rejectNoticeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F44336',
  },
  rejectNoticeReason: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  rejectNoticeTip: {
    fontSize: 13,
    color: '#999',
  },
  auditNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 15,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  auditNoticeText: {
    fontSize: 13,
    color: '#2196F3',
    flex: 1,
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submittingText: {
    fontSize: 14,
    color: '#8069E1',
    marginTop: 10,
  },
});
