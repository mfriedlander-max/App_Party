import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocialPost } from '@/features/social/SocialPost';
import type { SocialPost as SocialPostType } from '@/types';

const MOCK_POST: SocialPostType = {
  id: 'post-test',
  userId: 'user-1',
  imageUrl: 'https://example.com/image.jpg',
  caption: 'Great night out!',
  likeCount: 10,
  commentCount: 3,
  postedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
};

const MOCK_USER_NAME = 'Jordan Hayes';

describe('SocialPost — rendering', () => {
  it('renders avatar with user seed', () => {
    render(
      <SocialPost post={MOCK_POST} userName={MOCK_USER_NAME} userSeed="Jordan" />
    );
    // Avatar rendered via img with seed in src
    const img = document.querySelector('img') as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toContain('Jordan');
  });

  it('renders caption text', () => {
    render(
      <SocialPost post={MOCK_POST} userName={MOCK_USER_NAME} userSeed="Jordan" />
    );
    expect(screen.getByText('Great night out!')).toBeDefined();
  });

  it('renders user name', () => {
    render(
      <SocialPost post={MOCK_POST} userName={MOCK_USER_NAME} userSeed="Jordan" />
    );
    // User name appears in header (p tag) and as bold span in caption — getAllByText finds both
    const matches = screen.getAllByText('Jordan Hayes');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders initial like count', () => {
    render(
      <SocialPost post={MOCK_POST} userName={MOCK_USER_NAME} userSeed="Jordan" />
    );
    expect(screen.getByText('10')).toBeDefined();
  });

  it('renders comment count', () => {
    render(
      <SocialPost post={MOCK_POST} userName={MOCK_USER_NAME} userSeed="Jordan" />
    );
    expect(screen.getByText('3')).toBeDefined();
  });
});

describe('SocialPost — like interaction (immutable)', () => {
  it('like button increments displayed count', () => {
    render(
      <SocialPost post={MOCK_POST} userName={MOCK_USER_NAME} userSeed="Jordan" />
    );
    const likeBtn = screen.getByTestId('like-button');
    fireEvent.click(likeBtn);
    expect(screen.getByText('11')).toBeDefined();
  });

  it('original post object is not mutated after like', () => {
    const originalCount = MOCK_POST.likeCount;
    render(
      <SocialPost post={MOCK_POST} userName={MOCK_USER_NAME} userSeed="Jordan" />
    );
    const likeBtn = screen.getByTestId('like-button');
    fireEvent.click(likeBtn);
    // The original object must remain unchanged
    expect(MOCK_POST.likeCount).toBe(originalCount);
  });

  it('clicking like again decrements the count (toggle unlike)', () => {
    render(
      <SocialPost post={MOCK_POST} userName={MOCK_USER_NAME} userSeed="Jordan" />
    );
    const likeBtn = screen.getByTestId('like-button');
    fireEvent.click(likeBtn); // like → 11
    fireEvent.click(likeBtn); // unlike → 10
    expect(screen.getByText('10')).toBeDefined();
  });
});
