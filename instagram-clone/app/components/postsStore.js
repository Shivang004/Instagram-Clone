import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Sample initial posts with comments array including replies
const initialPosts = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131',
    caption: 'Beautiful sunset today! 🌅',
    username: 'user123',
    timestamp: new Date().toISOString(),
    likes: 42,
    isLiked: false,
    comments: [
      {
        id: '101',
        username: 'jane_doe',
        text: 'Wow, gorgeous view!',
        timestamp: new Date().toISOString(),
        replies: [
          {
            id: '101-1',
            username: 'user123',
            text: 'Thanks! It was amazing in person',
            timestamp: new Date().toISOString()
          }
        ]
      },
      {
        id: '102',
        username: 'travel_lover',
        text: 'Where was this taken?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        replies: []
      }
    ]
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5',
    caption: 'Morning coffee vibes ☕',
    username: 'user123',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    likes: 24,
    isLiked: false,
    comments: []
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    caption: 'Homemade pasta night! 🍝 #foodie',
    username: 'user123',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    likes: 78,
    isLiked: true,
    comments: [
      {
        id: '301',
        username: 'user123',
        text: 'That looks delicious! Recipe please?',
        timestamp: new Date(Date.now() - 170800000).toISOString(),
        replies: [
          {
            id: '301-1',
            username: 'chef_mark',
            text: "Thanks! I'll DM you the recipe 😊",
            timestamp: new Date(Date.now() - 169000000).toISOString()
          }
        ]
      },
      {
        id: '302',
        username: 'foodie_jen',
        text: 'Impressive plating!',
        timestamp: new Date(Date.now() - 168000000).toISOString(),
        replies: []
      }
    ]
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a',
    caption: 'Weekend hike with the best crew 🏔️ #adventure',
    username: 'user123',
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    likes: 128,
    isLiked: false,
    comments: [
      {
        id: '401',
        username: 'hiker88',
        text: 'Which trail is this?',
        timestamp: new Date(Date.now() - 258000000).toISOString(),
        replies: [
          {
            id: '401-1',
            username: 'mountain_girl',
            text: "It's the Eagle Ridge trail! Highly recommend.",
            timestamp: new Date(Date.now() - 257000000).toISOString()
          }
        ]
      }
    ]
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f',
    caption: "New book arrived today 📚 Can't wait to start reading!",
    username: 'user123',
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    likes: 36,
    isLiked: false,
    comments: [
      {
        id: '501',
        username: 'user123',
        text: "I just finished that one! You're in for a treat.",
        timestamp: new Date(Date.now() - 344000000).toISOString(),
        replies: []
      },
      {
        id: '502',
        username: 'literary_kate',
        text: 'One of my favorites from this author!',
        timestamp: new Date(Date.now() - 343200000).toISOString(),
        replies: [
          {
            id: '502-1',
            username: 'bookworm42',
            text: 'Have you read their previous work too?',
            timestamp: new Date(Date.now() - 342000000).toISOString()
          },
          {
            id: '502-2',
            username: 'literary_kate',
            text: 'Yes, all of them! This one might be the best though.',
            timestamp: new Date(Date.now() - 340000000).toISOString()
          }
        ]
      }
    ]
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
    caption: 'Just finished my new digital art piece! 🎨 #digitalart',
    username: 'user123',
    timestamp: new Date(Date.now() - 432000000).toISOString(),
    likes: 92,
    isLiked: true,
    comments: [
      {
        id: '601',
        username: 'gallery_owner',
        text: 'This is fantastic work! Would you be interested in collaborating?',
        timestamp: new Date(Date.now() - 430000000).toISOString(),
        replies: [
          {
            id: '601-1',
            username: 'artist_sam',
            text: "Absolutely! Let's talk details in DM.",
            timestamp: new Date(Date.now() - 428000000).toISOString()
          }
        ]
      },
      {
        id: '602',
        username: 'user123',
        text: 'The colors are mesmerizing! What software do you use?',
        timestamp: new Date(Date.now() - 429000000).toISOString(),
        replies: [
          {
            id: '602-1',
            username: 'artist_sam',
            text: 'Thanks! I use Procreate for most of my work.',
            timestamp: new Date(Date.now() - 426000000).toISOString()
          }
        ]
      }
    ]
  }
];

export const usePostsStore = create(
  persist(
    (set) => ({
      posts: initialPosts,
      
      // Add a new post
      addPost: (post) => set((state) => ({ 
        posts: [{
          ...post,
          comments: [],
          timestamp: new Date().toISOString(),
          likes: 0,
          isLiked: false
        }, ...state.posts] 
      })),
      
      // Like a post (increment likes and set isLiked flag)
      likePost: (postId) => set((state) => ({
        posts: state.posts.map(post => 
          post.id === postId ? { ...post, likes: post.likes + 1, isLiked: true } : post
        )
      })),

      // Unlike a post (decrement likes and remove isLiked flag)
      unlikePost: (postId) => set((state) => ({
        posts: state.posts.map(post => 
          post.id === postId ? { ...post, likes: Math.max(0, post.likes - 1), isLiked: false } : post
        )
      })),
      
      // Delete a post
      deletePost: (postId) => set((state) => ({
        posts: state.posts.filter(post => post.id !== postId)
      })),
      
      // Add a comment to a post
      addComment: (postId, commentText, username = 'user123') => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id === postId) {
            const newComment = {
              id: Date.now().toString(),
              username,
              text: commentText,
              timestamp: new Date().toISOString(),
              replies: []
            };
            return {
              ...post,
              comments: [...(post.comments || []), newComment]
            };
          }
          return post;
        })
      })),
      
      // Add a reply to a comment
      addReply: (postId, commentId, replyText, username = 'user123') => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => {
                if (comment.id === commentId) {
                  const newReply = {
                    id: `${commentId}-${Date.now()}`,
                    username,
                    text: replyText,
                    timestamp: new Date().toISOString()
                  };
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newReply]
                  };
                }
                return comment;
              })
            };
          }
          return post;
        })
      })),
      
      // Delete a comment
      deleteComment: (postId, commentId) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id === postId && post.comments) {
            return {
              ...post,
              comments: post.comments.filter(comment => comment.id !== commentId)
            };
          }
          return post;
        })
      })),
      
      // Delete a reply
      deleteReply: (postId, commentId, replyId) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => {
                if (comment.id === commentId && comment.replies) {
                  return {
                    ...comment,
                    replies: comment.replies.filter(reply => reply.id !== replyId)
                  };
                }
                return comment;
              })
            };
          }
          return post;
        })
      })),
    }),
    {
      name: 'instagram-posts-storage',
    }
  )
);