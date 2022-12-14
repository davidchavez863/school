import { post, get, put, del } from 'utils/apiUtils'
import { EnglishLevel, CurrentUser, User, UserToFollow } from './types'
import { getUploadingUrls } from 'Upload/api'
import {
  getCurrentUserId,
  getUserToken,
  updateCurrentUser,
} from 'User/currentUser'
import dayjs from 'dayjs'
import { updateData } from 'utils/queryClient'

type UserResponse = {
  user_id: number
  access_token: string
  name: string
  email: string
  gender: string
  profile_image_dir: string
  expression_points: string | number
  question_points: string | number
  activity_points: number
  base_language: string
  second_language: string
  instructor_initial: string
  instructor_theme: string | string[]
  is_instructor: string | number
  is_new?: boolean
  facebook_id?: string
  apple_id?: string
  instructor_profile?: string
  gdpr_agreed: number
  location: string
  organization: string
  user_type: number
  seen_tab_change_info: number
  school_seen_info: number
  finder_seen_info: number
  using_remember: number
  remember_notify_time: number
  remember_american: number
  class_based_info_seen: number
  classBasedPostExisting: number
  instructor_type?: string
  theme?: string
  city?: string
  country?: string
  checked_create_lecture?: number
  checked_instructor_page?: number
  unread_noti_count?: number
  obscene_check?: number
  should_see_notebook_update?: number
  add_share_notebook_update?: number
  seen_glass_notes_initial_info?: number
  premium_enabled?: number
  subscription_type?: number
  premium_expires?: number
  cancelled_renew?: number
  premium_platform?: number
}

const mapUser = (user: UserResponse): CurrentUser => ({
  isNew: user.is_new || false,
  isInstructor: Boolean(
    typeof user.is_instructor === 'string'
      ? parseInt(user.is_instructor)
      : user.is_instructor,
  ),
  id: user.user_id,
  token: user.access_token,
  name: user.name,
  email: user.email,
  avatar: user.profile_image_dir,
  language: user.base_language,
  location: user.location,
  englishLevel: 'Basic',
})

export const login = post(
  (
    params:
      | {
          emailBased: { email: string; password: string }
        }
      | {
          facebook: { userId: string; token: string }
        },
  ) => ({
    path: '/login',
    data: {
      ...('emailBased' in params ? params.emailBased : {}),
      ...('facebook' in params
        ? {
            facebook_id: params.facebook.userId,
            facebook_token: params.facebook.token,
          }
        : {}),
      type: 'emailBased' in params ? '0' : 'facebook' in params ? '1' : '2',
      register_type:
        'emailBased' in params ? undefined : 'facebook' in params ? '1' : '2',
      os: 2,
    },
    response: (data: {
      result_code: string
      data: UserResponse
    }): CurrentUser => {
      if (!data.data?.access_token)
        throw new Error('Email or password is invalid')
      return mapUser(data.data)
    },
  }),
)

export const register = post(
  (data: { email: string; password: string; name: string }) => ({
    path: '/register',
    data: {
      ...data,
      os: 2,
    },
    response: (data: {
      result_code: string
      data: UserResponse
    }): CurrentUser => {
      if (data.result_code === '02.01')
        throw new Error('User with such email already exists')
      if (data.result_code === '02.05')
        throw new Error('Username is restricted')
      if (data.result_code === '02.07') throw new Error('Password is too short')
      if (!data.data?.access_token) throw new Error('Something went wrong')
      return mapUser(data.data)
    },
  }),
)

export const forgotPassword = get((params: { email: string }) => ({
  path: '/forgot_password',
  params,
  response(data: { result_code: string }) {
    if (data.result_code === '16.01') throw new Error('User not found')
    if (data.result_code === '16.02')
      throw new Error('Account is linked to facebook or apple')
    if (data.result_code !== '16.00') throw new Error('Something went wrong')
    return data
  },
}))

export const updateBio = post(({ bio }: { bio: string }) => ({
  path: '/v1.3/update_bio',
  data: {
    access_token: getUserToken(),
    bio,
  },
  response({ result_code }: { result_code: string }) {
    if (result_code !== '36.00') throw new Error('Something went wrong')
    return
  },
}))

type ApiEnglishLevel = 'Beginner' | 'Intermediate' | 'Advanced'
const englishLevelToApi: Record<EnglishLevel, ApiEnglishLevel> = {
  Basic: 'Beginner',
  Intermediate: 'Intermediate',
  Advanced: 'Advanced',
}
const englishLevelFromApi: Record<ApiEnglishLevel, EnglishLevel> = {
  Beginner: 'Basic',
  Intermediate: 'Intermediate',
  Advanced: 'Advanced',
}

export const updateEnglishLevel = post(
  ({ englishLevel }: { englishLevel: EnglishLevel }) => ({
    path: '/v1.3/update_eng_level',
    data: {
      access_token: getUserToken(),
      eng_level: englishLevelToApi[englishLevel],
    },
    response({ result_code }: { result_code: string }) {
      if (result_code !== '35.00') throw new Error('Something went wrong')
      updateCurrentUser({ englishLevel })
    },
  }),
)

export const updateBaseLanguage = get(({ language }: { language: string }) => ({
  path: '/update_base_language',
  params: {
    access_token: getUserToken(),
    new_language: language,
  },
  response() {
    updateCurrentUser({ language })
    return
  },
}))

export const updateProfileImage = post(({ avatar }: { avatar: string }) => ({
  path: '/update_profile_image',
  data: {
    access_token: getUserToken(),
    new_profile_image: avatar,
  },
  response({ result_code }: { result_code: string }) {
    if (result_code !== '05.00') throw new Error('Something went wrong')
    updateCurrentUser({ avatar })
    return
  },
}))

export const updateLocation = get(({ location }: { location: string }) => ({
  path: '/v1.2/update_instructor_profile',
  params: {
    access_token: getUserToken(),
    location,
  },
  response({ result_code }: { result_code: string }) {
    if (result_code !== '22.00') throw new Error('Something went wrong')
    updateCurrentUser({ location })
    return
  },
}))

export const updateProfile = async ({
  avatar,
  bio,
  englishLevel,
  language,
  location,
}: {
  avatar?: string | { blob: Blob }
  bio?: string
  englishLevel?: EnglishLevel
  language?: string
  location?: string
}) => {
  const promises: Promise<unknown>[] = []

  if (typeof avatar === 'object' && 'blob' in avatar) {
    promises.push(
      new Promise(async (resolve, reject) => {
        try {
          const urls = await getUploadingUrls({
            domain: 'users/profile',
            photoCount: 1,
          })

          const { url, cdnUrl } = urls.photos[0]

          await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            body: avatar.blob,
          })

          await updateProfileImage({ avatar: cdnUrl })

          resolve()
        } catch (error) {
          reject(error)
        }
      }),
    )
  }

  if (bio) {
    promises.push(updateBio({ bio }))
  }

  if (englishLevel) {
    promises.push(updateEnglishLevel({ englishLevel }))
  }

  if (language) {
    promises.push(updateBaseLanguage({ language }))
  }

  if (location) {
    promises.push(updateLocation({ location }))
  }

  await Promise.all(promises)
}

export const getUser = get(({ id }: { id: number }) => ({
  path: '/v1.3/get_me_info',
  params: {
    access_token: getUserToken(),
    user_id: id,
  },
  response({
    data: user,
  }: {
    data: {
      user_id: number
      name: string
      profile_image_dir: string
      bio: string
      base_language: string
      eng_level: ApiEnglishLevel
      location: string
      followers: number
      following: number
      registration_date: string
    }
  }): User {
    return {
      id: user.user_id,
      name: user.name,
      avatar: user.profile_image_dir,
      bio: user.bio,
      language: user.base_language,
      englishLevel: englishLevelFromApi[user.eng_level],
      location: user.location,
      followersCount: user.followers,
      followingCount: user.following,
      createdAt: dayjs(user.registration_date).utc(),
    }
  },
}))

export const follow = get(
  ({
    user,
    updateCacheUserId,
  }: {
    user: UserToFollow
    updateCacheUserId?: number
  }) => ({
    path: '/follow_user',
    params: {
      access_token: getUserToken(),
      follower_id: user.id,
    },
    response() {
      const id = getCurrentUserId()
      if (updateCacheUserId) {
        const updater = (data: UserToFollow[]) =>
          data.map((item) =>
            item.id === user.id ? { ...item, isFollowing: true } : item,
          )
        updateData<UserToFollow[]>(
          ['user', updateCacheUserId, 'following'],
          updater,
        )
        updateData<UserToFollow[]>(
          ['user', updateCacheUserId, 'followers'],
          updater,
        )
      }
      updateData<UserToFollow[]>(['user', id, 'following'], (data) => [
        ...data,
        user,
      ])
      updateData<User>(['user', id], (data) => ({
        ...data,
        followingCount: data.followingCount + 1,
      }))
      updateData<User>(['user', user.id], (data) => ({
        ...data,
        followersCount: data.followersCount + 1,
      }))
    },
  }),
)

export const unfollow = get(
  ({
    user,
    updateCacheUserId,
  }: {
    user: UserToFollow
    updateCacheUserId?: number
  }) => ({
    path: '/unfollow_user',
    params: {
      access_token: getUserToken(),
      follower_id: user.id,
    },
    response() {
      const id = getCurrentUserId()
      if (updateCacheUserId) {
        const updater = (data: UserToFollow[]) =>
          data.map((item) =>
            item.id === user.id ? { ...item, isFollowing: false } : item,
          )
        updateData<UserToFollow[]>(
          ['user', updateCacheUserId, 'following'],
          updater,
        )
        updateData<UserToFollow[]>(
          ['user', updateCacheUserId, 'followers'],
          updater,
        )
      }
      updateData<UserToFollow[]>(['user', id, 'following'], (data) =>
        data.filter((item) => item.id !== user.id),
      )
      updateData<User>(['user', id], (data) => ({
        ...data,
        followingCount: data.followingCount - 1,
      }))
      updateData<User>(['user', user.id], (data) => ({
        ...data,
        followersCount: data.followersCount - 1,
      }))
    },
  }),
)

export const approveJoinRequest = put(
  ({ classId, userId }: { classId: number; userId: number }) => ({
    path: `/class/${classId}/application/${userId}`,
    data: {
      access_token: getUserToken(),
    },
  }),
)

export const removeMember = del(
  ({ classId, userId }: { classId: number; userId: number }) => ({
    path: `/class/${classId}/member/${userId}`,
    params: {
      access_token: getUserToken(),
    },
  }),
)

export const changePassword = post(
  ({
    oldPassword,
    newPassword,
  }: {
    oldPassword: string
    newPassword: string
  }) => ({
    path: '/change_password',
    data: {
      access_token: getUserToken(),
      old_password: oldPassword,
      new_password: newPassword,
    },
    response({ result_code }: { result_code: string }) {
      if (result_code !== '04.00') throw new Error('Incorrect Password')
    },
  }),
)

const followersResponse = ({
  data,
}: {
  data?: {
    user_id: number
    name: string
    profile_image_dir: string
    check_following: 0 | 1
  }[]
}): {
  id: number
  name: string
  avatar: string
  isFollowing: boolean
}[] => {
  if (!data) throw new Error('Something went wrong')

  return data.map((user) => ({
    id: user.user_id,
    name: user.name,
    avatar: user.profile_image_dir,
    isFollowing: Boolean(user.check_following),
  }))
}

export const getWhoUserIsFollowing = get(({ userId }: { userId: number }) => ({
  path: '/get_following_by_user_id',
  params: {
    access_token: getUserToken(),
    search_user_id: userId,
  },
  response: followersResponse,
}))

export const getWhoIsFollowingUser = get(({ userId }: { userId: number }) => ({
  path: '/get_follower_by_user_id',
  params: {
    access_token: getUserToken(),
    search_user_id: userId,
  },
  response: followersResponse,
}))
