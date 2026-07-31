import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/api';
import Avatar from '@/components/Avatar';
import CircleButton from '@/components/CircleButton';
import ProductCard from '@/components/ProductCard';
import SegmentChips from '@/components/SegmentChips';
import { SkeletonGrid } from '@/components/Skeleton';
import { ErrorView, LoadingView } from '@/components/StatusViews';
import { IMG } from '@/config';
import { useStartChat } from '@/hooks/useChat';
import { colors, shadow } from '@/theme';
import type { Listing, Review, Vendor } from '@/types';

const SEGMENTS = ['All Items', 'Popular'];

export default function VendorStorefront() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vendorId = Number(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const startChat = useStartChat();
  const [segment, setSegment] = useState('All Items');
  const [showReviews, setShowReviews] = useState(false);

  const vendor = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => api.get<Vendor>(`/vendors/${vendorId}`),
  });
  const listings = useQuery({
    queryKey: ['vendor-listings', vendorId],
    queryFn: () => api.get<Listing[]>(`/vendors/${vendorId}/listings`),
  });
  const reviews = useQuery({
    queryKey: ['vendor-reviews', vendorId],
    queryFn: () => api.get<Review[]>(`/vendors/${vendorId}/reviews`),
    enabled: showReviews,
  });

  const rows = useMemo(() => {
    const all = listings.data ?? [];
    if (segment === 'Popular') return [...all].sort((a, b) => (b.compareAtMinor ? 1 : 0) - (a.compareAtMinor ? 1 : 0)).slice(0, 6);
    return all;
  }, [listings.data, segment]);

  const openChat = () => startChat(vendorId);

  if (vendor.isLoading) return <LoadingView />;
  if (vendor.isError || !vendor.data)
    return <ErrorView message="Could not load this vendor." onRetry={() => vendor.refetch()} />;
  const v = vendor.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Cover with rounded bottom + overlapping logo */}
        <View>
          <Image source={{ uri: IMG(v.coverUrl) }} style={styles.cover} contentFit="cover" />
          <View style={styles.logoWrap}>
            <Avatar url={v.logoUrl} name={v.name} size={64} square />
          </View>
        </View>

        <View style={styles.headerBlock}>
          <Animated.View entering={FadeInDown.duration(320)}>
            <Text style={styles.name}>{v.name}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>{v.rating.toFixed(1)}/5</Text>
              <Ionicons name="star" size={14} color={colors.star} />
              <Text style={styles.ratingCount}>({v.reviewCount}+)</Text>
              <TouchableOpacity
                style={styles.reviewsChip}
                onPress={() => setShowReviews((s) => !s)}
              >
                <Text style={styles.reviewsChipText}>
                  {showReviews ? 'Hide reviews' : 'See reviews'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatBtn} onPress={openChat}>
                <Ionicons name="chatbubble-ellipses-outline" size={17} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <Text style={styles.bio}>{v.bio}</Text>
            <Text style={styles.location}>
              {v.specialty} · {v.location}
            </Text>
          </Animated.View>

          {showReviews ? (
            <Animated.View entering={FadeInDown.duration(280)} style={styles.reviewsCard}>
              {(reviews.data ?? []).map((review) => (
                <View key={review.id} style={styles.reviewRow}>
                  <Avatar url={review.userAvatarUrl} name={review.userName} size={32} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.reviewTop}>
                      <Text style={styles.reviewName}>{review.userName}</Text>
                      <View style={styles.reviewStars}>
                        <Ionicons name="star" size={11} color={colors.star} />
                        <Text style={styles.reviewRating}>{review.rating}</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          ) : null}

          <SegmentChips
            segments={SEGMENTS}
            value={segment}
            onChange={setSegment}
            style={{ marginTop: 18 }}
          />

          <Text style={styles.allItems}>
            {segment === 'All Items' ? `All items in ${v.name}` : 'Popular right now'}
          </Text>
          <Text style={styles.allItemsSub}>Discover our recommendations for you</Text>

          {listings.isLoading ? (
            <View style={{ marginTop: 16 }}>
              <SkeletonGrid count={4} />
            </View>
          ) : (
            <View style={styles.grid}>
              {rows.map((listing, i) => (
                <Animated.View
                  key={listing.id}
                  entering={FadeInDown.delay(i * 45).duration(320)}
                  style={styles.gridCell}
                >
                  <ProductCard listing={listing} hideVendor />
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.back, { top: insets.top + 8 }]}>
        <CircleButton icon="chevron-back" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: 210,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.surfaceAlt,
  },
  logoWrap: {
    position: 'absolute',
    left: 20,
    bottom: -26,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...shadow,
  },
  headerBlock: { paddingHorizontal: 20, paddingTop: 38 },
  name: { fontSize: 21, fontWeight: '800', color: colors.ink },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  ratingText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  ratingCount: { fontSize: 12.5, color: colors.inkFaint },
  reviewsChip: {
    marginLeft: 'auto',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  reviewsChipText: { fontSize: 12, color: colors.inkSoft, fontWeight: '600' },
  chatBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bio: { fontSize: 13, color: colors.inkSoft, marginTop: 10, lineHeight: 19 },
  location: { fontSize: 12, color: colors.inkFaint, marginTop: 4 },
  reviewsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginTop: 14,
    gap: 12,
    ...shadow,
  },
  reviewRow: { flexDirection: 'row', gap: 10 },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewName: { fontSize: 13, fontWeight: '700', color: colors.ink },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reviewRating: { fontSize: 12, fontWeight: '700', color: colors.ink },
  reviewComment: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2, lineHeight: 17 },
  allItems: { fontSize: 17, fontWeight: '700', color: colors.ink, marginTop: 20 },
  allItemsSub: { fontSize: 12.5, color: colors.inkFaint, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16 },
  gridCell: { width: '47%', flexGrow: 1 },
  back: { position: 'absolute', left: 16 },
});
