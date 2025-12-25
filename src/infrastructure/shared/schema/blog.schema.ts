import mongoose, { Schema, Document } from 'mongoose';

export interface ILocalizedContent {
  en?: string;
  ar?: string;
}

export interface IBlog extends Document {
  _id: mongoose.Types.ObjectId;
  title: ILocalizedContent;
  content: ILocalizedContent;
  excerpt?: ILocalizedContent;
  slug: ILocalizedContent;
  author: {
    id: string;
    name: string;
    email: string;
  };
  tags: {
    en: string[];
    ar: string[];
  };
  category: ILocalizedContent;
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  likes: number;
  comments: {
    id: string;
    author: {
      id: string;
      name: string;
    };
    content: string;
    createdAt: Date;
  }[];
}

const LocalizedContentSchema = new Schema({
  en: { type: String },
  ar: { type: String }
}, { _id: false });

const BlogSchema = new Schema<IBlog>({
  title: {
    type: LocalizedContentSchema,
    required: true
  },
  content: {
    type: LocalizedContentSchema,
    required: true
  },
  excerpt: {
    type: LocalizedContentSchema
  },
  slug: {
    type: LocalizedContentSchema,
    required: true
  },
  author: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  tags: {
    en: [{
      type: String,
      trim: true
    }],
    ar: [{
      type: String,
      trim: true
    }]
  },
  category: {
    type: LocalizedContentSchema,
    required: true
  },
  featuredImage: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    id: {
      type: String,
      required: true
    },
    author: {
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
BlogSchema.index({ 'slug.en': 1 });
BlogSchema.index({ 'slug.ar': 1 });
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ 'author.id': 1 });
BlogSchema.index({ 'category.en': 1 });
BlogSchema.index({ 'category.ar': 1 });
BlogSchema.index({ 'tags.en': 1 });
BlogSchema.index({ 'tags.ar': 1 });

// Text search indexes for both languages
BlogSchema.index({ 
  'title.en': 'text', 
  'title.ar': 'text',
  'content.en': 'text', 
  'content.ar': 'text',
  'excerpt.en': 'text',
  'excerpt.ar': 'text'
});

// Pre-save middleware to auto-generate slugs from titles
BlogSchema.pre('save', async function() {
  // Generate English slug if title exists but slug doesn't
  if (this.title?.en && !this.slug?.en) {
    if (!this.slug) this.slug = {};
    this.slug.en = this.title.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Generate Arabic slug if title exists but slug doesn't
  if (this.title?.ar && !this.slug?.ar) {
    if (!this.slug) this.slug = {};
    this.slug.ar = this.title.ar
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FF0-9-]/g, '')
      .replace(/^-+|-+$/g, '');
  }
});

// Update publishedAt when status changes to published
BlogSchema.pre('save', async function() {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
});

// Validation: Ensure at least one language is present for required fields
BlogSchema.pre('validate', function() {
  // Title validation
  if (!this.title?.en && !this.title?.ar) {
    this.invalidate('title', 'At least one language (English or Arabic) is required for title');
  }
  
  // Content validation
  if (!this.content?.en && !this.content?.ar) {
    this.invalidate('content', 'At least one language (English or Arabic) is required for content');
  }
  
  // Category validation
  if (!this.category?.en && !this.category?.ar) {
    this.invalidate('category', 'At least one language (English or Arabic) is required for category');
  }
  
  // Slug validation
  if (!this.slug?.en && !this.slug?.ar) {
    this.invalidate('slug', 'At least one language slug is required');
  }
  
  // Excerpt length validation
  if (this.excerpt?.en && this.excerpt.en.length > 500) {
    this.invalidate('excerpt.en', 'English excerpt must be less than 500 characters');
  }
  if (this.excerpt?.ar && this.excerpt.ar.length > 500) {
    this.invalidate('excerpt.ar', 'Arabic excerpt must be less than 500 characters');
  }
});

export const BlogModel = mongoose.model<IBlog>('Blog', BlogSchema);