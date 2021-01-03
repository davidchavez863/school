import { get, post } from 'Shared/apiUtils'
import { getUserToken } from 'User/currentUser'
import { Post } from 'Post/types'
import dayjs from 'dayjs'

type ListPostResponse = {
  base_language: string
  check_like: number
  check_notebook: number
  class_admin: number
  class_ids: string
  class_joined: number
  class_names: string
  class_owner: number
  comment: string
  date: string
  filtered_sound: string
  hashtag: string
  is_following: number
  is_instructor: number
  is_notification_following: number
  is_obscene: number
  is_pano: number
  is_public: number
  like_count: number
  liked: number
  link: string
  looping_url: string
  name: string
  photo_dir: string
  photo_dir_fifth: string
  photo_dir_fourth: string
  photo_dir_second: string
  photo_dir_third: string
  post_type: number
  preview_image: string
  preview_title: string
  profile_image_dir: string
  record_filter_type: number
  reply_count: number
  s_lecture_first_content: string
  s_lecture_first_link: string
  s_lecture_first_photo_dir: string
  s_lecture_first_sound_dir: string
  s_lecture_fourth_content: string
  s_lecture_fourth_link: string
  s_lecture_fourth_photo_dir: string
  s_lecture_fourth_sound_dir: string
  s_lecture_id: number
  s_lecture_notebook_sentence: string
  s_lecture_notebook_translation: string
  s_lecture_second_content: string
  s_lecture_second_link: string
  s_lecture_second_photo_dir: string
  s_lecture_second_sound_dir: string
  s_lecture_third_content: string
  s_lecture_third_link: string
  s_lecture_third_photo_dir: string
  s_lecture_third_sound_dir: string
  share_post_id: number
  shared_comment: string
  shared_flow_comment_id: number
  shared_flow_id: number
  shared_flow_title: string
  shared_flow_username: string
  shared_glass_id: number
  shared_lecture_id: number
  shared_lecture_title: string
  shared_lecture_user_name: string
  shared_lingo_comment_id: number
  shared_lingo_id: number
  shared_lingo_profile: string
  shared_lingo_topic: string
  shared_lingo_user_id: number
  shared_lingo_username: string
  shared_notebook_id: number
  shared_share_id: number
  shared_share_user_id: number
  shared_share_user_name: string
  shared_title: string
  sound_dir: string
  sound_for_lecture: number
  tagged_class_ids: string
  tagged_class_ranges: string
  tagged_flow_ids: string
  tagged_flow_ranges: string
  tagged_user_ids: string
  tagged_user_ranges: string
  theme: string
  title: string
  translated_title: string
  user_id: number
  video: string
  youtube_id: number
  zoom_link: string
}

export const list = get(
  ({ limit, offset }: { limit: number; offset: number }) => ({
    path: '/rest_share',
    params: {
      limit_posts: limit,
      num_of_posts: offset,
    },
    response: (data: { data: ListPostResponse[] }): Post[] => {
      return data.data.map((post) => ({
        id: post.share_post_id,
        text: post.comment,
        previews: [],
        date: dayjs(post.date),
      }))
    },
  }),
)

type CreatePostResponse = {
  comment: string
  filtered_sound: string
  hashtag: string
  is_obscene: number
  is_pano: number
  is_public: number
  link: string
  looping_url: string
  photo_dir: string
  photo_dir_fifth: string
  photo_dir_fourth: string
  photo_dir_second: string
  photo_dir_third: string
  post_type: number
  preview_image: string
  preview_title: string
  record_filter_type: string
  share_post_id: number
  shared_flow_id: number
  shared_flow_title: string
  shared_lecture_id: number
  shared_lingo_id: number
  shared_share_id: number
  sound_dir: string
  sound_for_lecture: number
  tagged_class_ids: string
  tagged_class_ranges: string
  tagged_flow_ids: string
  tagged_flow_ranges: string
  tagged_user_ids: string
  tagged_user_ranges: string
  theme: string
  title: string
  translated_title: string
  user_id: number
  video: string
  youtube_id: string
  zoom_link: string
}

export const create = post(({ text }: { text: string }) => ({
  path: '/add_share_post',
  data: {
    access_token: getUserToken(),
    comment: text,
    is_public: 0,
  },
  response: (data: { result_code: string; data: CreatePostResponse }): Post => {
    if (data.result_code !== '01.00') throw new Error('Something went wrong')
    const post = data.data

    return {
      id: post.share_post_id,
      text: post.comment,
      previews: [],
      date: dayjs(),
    }
  },
}))