export interface InstagramAuthState {
  isAuthenticated: boolean;
  csrfToken: string | null;
}

export interface InstagramUser {
  pk: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
}

export interface ImageCandidate {
  url: string;
  width: number;
  height: number;
}

export interface VideoVersion {
  url: string;
  width: number;
  height: number;
  type: number;
}

export interface InstagramMediaItem {
  pk: string;
  id: string;
  code: string;
  media_type: number;
  taken_at: number;
  user: InstagramUser;
  image_versions2?: {
    candidates: ImageCandidate[];
  };
  video_versions?: VideoVersion[];
  caption?: {
    text: string;
    created_at: number;
  };
  saved_collection_ids?: string[];
}

export interface SavedPostsPage {
  items: InstagramMediaItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export type CollectionMap = Map<string, string>;

export interface RecollectBookmarkMetadata {
  instagram_username: string;
  instagram_profile_pic: string;
  favIcon: string;
  video_url?: string;
  saved_collection_names: string[];
}

export interface RecollectBookmark {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
  type: "instagram";
  meta_data: RecollectBookmarkMetadata;
  saved_at: string;
}
