export const allRollsQuery = `*[_type == "roll"] | order(shotDate desc) {
  _id,
  title,
  slug,
  rollNumber,
  coverImage,
  filmType,
  camera,
  shotDate,
  "photos": photos[] | order(order asc) {
    _key,
    image,
    order
  }
}`;

export const rollBySlugQuery = `*[_type == "roll" && slug.current == $slug][0] {
  _id,
  rollNumber,
  title,
  slug,
  filmType,
  camera,
  lens,
  iso,
  shotDate,
  endDate,
  developer,
  scanner,
  rating,
  coverImage,
  photos[] | order(order asc) {
    _key,
    image,
    caption,
    order
  },
  notes,
  enableComments,
  publishedAt
}`;

export const commentsByRollQuery = `*[_type == "comment" && roll._ref == $rollId && isApproved == true] | order(createdAt desc) {
  _id,
  nickname,
  content,
  createdAt
}`;

export const sidebarRollsQuery = `*[_type == "roll"] | order(shotDate desc) {
  _id,
  title,
  slug,
  rollNumber
}`;

export const allRollSlugsQuery = `*[_type == "roll"].slug.current`;
