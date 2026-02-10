import type {
  CollectionMap,
  InstagramMediaItem,
  RecollectBookmark,
} from "./types";

const FAVICON_URL =
  "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://instagram.com&size=128";

const MAX_DESCRIPTION_LENGTH = 300;

export function sanitizeUnicode(str: string | null | undefined): string {
  if (!str) {
    return "";
  }
  return str.replace(/[\uD800-\uDFFF]/g, "");
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return `${str.slice(0, maxLength - 3)}...`;
}

export function transformToBookmark(
  media: InstagramMediaItem,
  collectionMap: CollectionMap
): RecollectBookmark {
  const collectionNames = (media.saved_collection_ids ?? [])
    .map((id) => collectionMap.get(String(id)))
    .filter((name): name is string => name != null);

  return {
    url: `https://www.instagram.com/p/${media.code}/`,
    title: sanitizeUnicode(media.user.full_name || media.user.username),
    description: truncate(
      sanitizeUnicode(media.caption?.text ?? ""),
      MAX_DESCRIPTION_LENGTH
    ),
    ogImage: media.image_versions2?.candidates?.[0]?.url ?? null,
    type: "instagram",
    meta_data: {
      instagram_username: sanitizeUnicode(media.user.username),
      instagram_profile_pic: media.user.profile_pic_url,
      favIcon: FAVICON_URL,
      ...(media.video_versions?.[0]?.url
        ? { video_url: media.video_versions[0].url }
        : {}),
      saved_collection_names: collectionNames,
    },
    saved_at: new Date(media.taken_at * 1000).toISOString(),
  };
}
