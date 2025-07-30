# Atom HR Community Wall

A modern and highly interactive community platform designed exclusively for HR department employees to foster seamless engagement, communication, and knowledge sharing.

![HR Community Wall](https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80)

## 🌟 Features

### Core Functionality

#### 📝 Post Management
- **Rich Text Editor**: Powered by Quill.js with formatting options (Bold, Italic, Bullet Points)
- **Multi-Media Support**:
  - 🖼️ Image attachments (JPEG, PNG, GIF, WebP) - up to 5MB each
  - 🎥 Video embedding (MP4, WebM, OGG, AVI, MOV) - up to 50MB each
  - 📄 Document uploads (PDF, Word, Excel, PowerPoint) - up to 10MB each
  - 🔗 Link sharing with auto-preview generation
- **User Mentions**: @mention colleagues with interactive profile links
- **Categorization**: Predefined HR-specific tags and categories
- **Post Actions**: Edit, delete, like, comment, and share functionality

#### 👥 User Management
- **Authentication**: Secure login system with dummy HR employee accounts
- **Profile Integration**: Rich user profiles with avatars and positions
- **Role-Based Access**: HR department exclusive access

#### 🏷️ Content Organization
- **Categories**: 
  - 📢 Announcements
  - 🏆 Achievements  
  - 💬 General Discussion
  - 📋 Policy Updates
  - 💡 Ideas & Suggestions
  - 📚 Training Materials
- **Search & Filter**: Real-time content discovery
- **Chronological Feed**: Newest-first post ordering with timestamps

#### 💬 Interactive Features
- **Comments System**: Threaded discussions with like functionality
- **Real-time Engagement**: Like posts and comments
- **Mention Notifications**: Interactive user mentions
- **Content Sharing**: Social sharing capabilities

## 🛠️ Tech Stack

- **Frontend Framework**: React 19.1.0
- **Styling**: Tailwind CSS 4.1.11
- **Rich Text Editor**: Quill.js (react-quill)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Vite 7.0.4
- **Package Manager**: npm

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cw-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Demo Login Credentials

Use any of these dummy accounts to explore the platform:

| Name | Email | Password | Role |
|------|-------|----------|------|
| Sarah Johnson | sarah.johnson@atomhr.com | password123 | HR Manager |
| Michael Chen | michael.chen@atomhr.com | password123 | Recruitment Specialist |
| Emily Rodriguez | emily.rodriguez@atomhr.com | password123 | HR Business Partner |
| David Kumar | david.kumar@atomhr.com | password123 | Learning & Development Manager |
| Lisa Thompson | lisa.thompson@atomhr.com | password123 | Compensation & Benefits Analyst |

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   └── LoginPage.jsx          # Authentication interface
│   ├── Dashboard/
│   │   ├── Dashboard.jsx          # Main dashboard layout
│   │   ├── Header.jsx             # Top navigation bar
│   │   └── Sidebar.jsx            # Navigation and filters
│   └── Posts/
│       ├── CreatePost.jsx         # Post creation modal
│       ├── PostCard.jsx           # Individual post display
│       └── PostFeed.jsx           # Posts timeline
├── contexts/
│   ├── AuthContext.jsx            # Authentication state management
│   └── PostContext.jsx            # Posts state management
├── utils/
│   └── helpers.js                 # Utility functions
├── App.jsx                        # Main application component
├── App.css                        # Global styles and Quill customization
└── main.jsx                       # Application entry point
```

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (600, 700, 50, 100)
- **Success**: Green (600, 50, 100)
- **Warning**: Orange (600, 50, 100)
- **Error**: Red (600, 50, 100)
- **Info**: Blue (600, 50, 100)
- **Purple**: Purple (600, 50, 100)
- **Pink**: Pink (600, 50, 100)

### Typography
- **Font Family**: System UI, -apple-system, sans-serif
- **Headings**: Semibold (600) and Bold (700)
- **Body**: Regular (400) and Medium (500)

### Components
- **Cards**: Rounded corners (8px), subtle shadows
- **Buttons**: Multiple variants with hover states
- **Forms**: Consistent focus states with ring styling
- **Modals**: Backdrop blur with centered positioning

## 🔧 Key Components

### AuthContext
Manages user authentication state and provides login/logout functionality with persistent sessions.

### PostContext  
Handles all post-related operations including CRUD operations, likes, comments, and filtering.

### CreatePost Modal
Full-featured post creation interface with:
- Rich text editing
- File attachments
- User mentions
- Category selection
- Media preview

### PostCard
Interactive post display with:
- Content rendering
- Media attachments
- Action buttons (like, comment, share)
- Edit/delete for post authors
- Threaded comments

## 📱 Responsive Design

The platform is fully responsive across all devices:
- **Desktop**: Full-featured experience with sidebar navigation
- **Tablet**: Adapted layouts with touch-friendly interfaces
- **Mobile**: Optimized for mobile interaction patterns

## 🔒 Security Features

- Input sanitization for HTML content
- File type and size validation
- XSS protection through content sanitization
- Secure authentication flow

## 🚀 Performance Optimizations

- **Code Splitting**: Dynamic imports for better loading
- **Image Optimization**: Automatic image compression
- **Lazy Loading**: Components loaded on demand
- **Debounced Search**: Optimized search performance
- **Memoization**: React.memo for expensive components

## 🧪 Development Scripts

```bash
# Development server
npm run dev

# Production build  
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest) 
- Safari (latest)
- Edge (latest)

## 📝 Usage Examples

### Creating a Post
1. Click "Create Post" button in sidebar
2. Use rich text editor for content
3. Add categories, mentions, and attachments
4. Click "Post" to publish

### Interacting with Posts
- **Like**: Click heart icon
- **Comment**: Click comment icon and type
- **Share**: Click share icon for options
- **Edit**: Click menu (⋯) → Edit (for your posts)
- **Delete**: Click menu (⋯) → Delete (for your posts)

### Filtering Content
- Use category buttons in sidebar
- Search by content or author name
- Filter by post type or date

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For technical support or feature requests, please contact the development team.

## 🎯 Future Enhancements

- [ ] Real-time notifications
- [ ] File version control
- [ ] Advanced search with filters
- [ ] Export functionality
- [ ] Integration with HR systems
- [ ] Mobile app version
- [ ] Dark mode theme
- [ ] Advanced analytics dashboard

---

**Built with ❤️ for the Atom HR Team**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration



---

# 📊 Technical Report: PostCard Component & API Integration

## Overview

The `PostCard` component is a central part of the platform, responsible for rendering individual posts, handling user interactions, and integrating with backend APIs for all post-related actions. It is designed to be robust, flexible, and compatible with multiple backend data formats.

## Key Features

- **Post Normalization:** Handles various backend field names and formats, ensuring consistent rendering regardless of API response structure.
- **Attachments:** Supports images, videos, documents (PDF and others), and links, each with appropriate UI and preview logic.
- **Reactions & Likes:** Implements emoji reactions (👍, ❤️, 😊, 😂, 😮, 😢, 😡, 🎉) and traditional likes, with logic to support both legacy and new backend formats (`reactions` array, `reaction_counts` object).
- **Comments & Replies:** Allows users to add, like, reply to, and delete comments and replies, with support for reactions on comments.
- **User Actions:** Edit/delete for post authors, report/block for others, with confirmation modals for destructive actions.
- **Share Functionality:** Uses the Web Share API or clipboard fallback for sharing posts.
- **UI/UX:** Responsive, modern design with accessibility and usability in mind.

## API Calls & Integration

The following API-related actions are invoked from the `PostCard.jsx` component (actual implementations are abstracted in hooks and service files):

- `addReaction(postId, reactionType, emoji?)`: Add or toggle a reaction for a post.
- `addComment(postId, commentText)`: Add a comment to a post.
- `likeComment(postId, commentId)`: Like a comment.
- `deleteComment(postId, commentId)`: Delete a comment.
- `addReply(postId, commentId, replyText)`: Add a reply to a comment.
- `deleteReply(postId, commentId, replyId)`: Delete a reply.
- `deletePost(postId)`: Delete a post.
- `hasUserReacted(postId, reactionType)`: Check if the user has reacted to a post.

These functions are likely connected to backend REST APIs for posts, comments, reactions, and user management. See `src/services/api.js` and context hooks for details.

## Data Flow

- Data is passed to `PostCard` as the `post` prop.
- User context is accessed via `useAuth()`.
- Post actions are managed via `usePost()`, which abstracts API calls and state updates.
- UI state (modals, dropdowns, input fields) is managed with React `useState`.

## Security & Validation

- Actions like liking, commenting, and reacting are disabled for public (not logged-in) users.
- Confirmation is required for destructive actions (delete, block).
- Clipboard and sharing actions have fallbacks for browser compatibility.

## Summary

The `PostCard` component provides a robust, user-friendly interface for post interaction, supporting:
- Data normalization for flexible backend integration
- Rich media and attachment support
- Full suite of social actions (like, react, comment, reply, share)
- Modern, accessible UI/UX

For more details, see the code in `src/components/Posts/PostCard.jsx` and related context/service files.
