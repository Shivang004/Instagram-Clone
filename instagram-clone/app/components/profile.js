'use client';

import { usePostsStore } from '../../lib/store/postsStore';
import styles from './profile.module.css';
import Image from 'next/image'

const Profile = ({ userData }) => {
  // Get posts from the store to calculate post count
  const posts = usePostsStore((state) => state.posts);

  // Filter posts by the current user
  const userPosts = posts.filter(post => post.username === 'user123');

  // Default data if no props are provided
  const defaultData = {
    username: 'user123',
    fullName: 'Mr. Tom',
    bio: '📱 Digital Creator',
    avatarUrl: '/images/avatar.jpg', // Default avatar path
    stats: {
      followers: 1234,
      following: 567
    }
  };

  // Use provided data or default data
  const user = userData || defaultData;

  return (
    <section className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarContainer}>
          <Image
            src="https://images.unsplash.com/photo-1739907548147-f991baedfd5e?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt={`${user.username}'s profile picture`}
            className={styles.avatar}
          />
        </div>

        <div className={styles.profileInfo}>
          <h2 className={styles.username}>{user.username}</h2>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statCount}>{userPosts.length}</span>
              <span className={styles.statLabel}>posts</span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statCount}>{user.stats.followers}</span>
              <span className={styles.statLabel}>followers</span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statCount}>{user.stats.following}</span>
              <span className={styles.statLabel}>following</span>
            </div>
          </div>

          <div className={styles.bioContainer}>
            <h1 className={styles.fullName}>{user.fullName}</h1>
            <p className={styles.bio}>{user.bio}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;