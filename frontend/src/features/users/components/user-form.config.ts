// src/features/users/config/user-form.config.ts
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { FormFieldConfigGeneric, ComponentMap } from '@/components/form/types'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { userTypes } from '../data/data'

// 假设数据在这里

// 用户表单的 Zod Schema (与之前类似，但移除 isEdit)
// isEdit 逻辑应该在调用 JsonForm 的地方处理，而不是 schema 内部
// 或者通过动态调整 schema 来实现
export const userFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First Name is required.' }),
  lastName: z.string().min(1, { message: 'Last Name is required.' }),
  username: z.string().min(1, { message: 'Username is required.' }),
  phoneNumber: z.string().min(1, { message: 'Phone number is required.' }),
  email: z
    .string()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Email is invalid.' }),
  role: z.string().min(1, { message: 'Role is required.' }),
  // 密码字段变为可选，在 superRefine 中根据 isEdit 决定是否必须
  password: z
    .string()
    .optional()
    .transform((pwd) => pwd?.trim() ?? ''),
  confirmPassword: z
    .string()
    .optional()
    .transform((pwd) => pwd?.trim() ?? ''),
})

// 添加 refine/superRefine 以处理条件验证
export const getUserFormSchema = (isEdit: boolean) =>
  userFormSchema.superRefine(({ password, confirmPassword }, ctx) => {
    const passwordProvided = password && password.length > 0

    // 规则：
    // 1. 新增模式下，密码是必须的
    // 2. 编辑模式下，如果输入了密码，则执行所有验证规则
    // 3. 无论哪种模式，如果输入了密码，确认密码必须匹配

    if (!isEdit) {
      // 新增模式
      if (!passwordProvided) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password is required.',
          path: ['password'],
        })
      }
    }

    // 如果密码被输入了 (新增模式下 或 编辑模式下用户主动修改)
    if (passwordProvided) {
      if (password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must be at least 8 characters long.',
          path: ['password'],
        })
      }
      if (!password.match(/[a-z]/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must contain at least one lowercase letter.',
          path: ['password'],
        })
      }
      if (!password.match(/\d/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must contain at least one number.',
          path: ['password'],
        })
      }
      // 只有在输入了密码时，才需要比较确认密码
      if (password !== confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords don't match.",
          path: ['confirmPassword'],
        })
      }
    }

    // 如果输入了密码，但没输入确认密码
    if (
      passwordProvided &&
      (!confirmPassword || confirmPassword.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please confirm your password.',
        path: ['confirmPassword'],
      })
    }
  })

// 用户表单的数据类型
export type UserFormData = z.infer<typeof userFormSchema>

// 用户表单的组件映射 (可以全局共享，也可以按需定义)
export const userFormComponentMap: ComponentMap = {
  input: Input,
  password: PasswordInput,
  select: SelectDropdown,
}

// 用户表单的字段配置
// 注意：类型为 FormFieldConfigGeneric<UserFormData>
export const getUserFormConfig = (
  isEdit: boolean
): FormFieldConfigGeneric<UserFormData>[] => [
  {
    name: 'firstName',
    label: 'First Name',
    componentType: 'input',
    componentProps: { placeholder: 'John', autoComplete: 'off' },
  },
  {
    name: 'lastName',
    label: 'Last Name',
    componentType: 'input',
    componentProps: { placeholder: 'Doe', autoComplete: 'off' },
  },
  {
    name: 'username',
    label: 'Username',
    componentType: 'input',
    componentProps: { placeholder: 'john_doe' },
  },
  {
    name: 'email',
    label: 'Email',
    componentType: 'input',
    componentProps: { placeholder: 'john.doe@gmail.com' },
  },
  {
    name: 'phoneNumber',
    label: 'Phone Number',
    componentType: 'input',
    componentProps: { placeholder: '+123456789' },
  },
  {
    name: 'role',
    label: 'Role',
    componentType: 'select',
    componentProps: {
      placeholder: 'Select a role',
      items: userTypes.map(({ label, value }) => ({ label, value })),
    },
  },
  {
    name: 'password',
    label: 'Password',
    componentType: 'password',
    componentProps: {
      placeholder: isEdit
        ? 'Leave blank to keep current password'
        : 'e.g., S3cur3P@ssw0rd',
    },
    // 密码字段总是渲染
  },
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    componentType: 'password',
    componentProps: { placeholder: 'Confirm your new password' },
    // 仅当 password 字段被触摸或有值时才启用 confirmPassword
    // RHF v7+ 使用 formState.dirtyFields 或 form.watch()
    getDynamicProps: (form) => ({
      // 只有在 'password' 字段有值时才启用，并且密码字段必须被渲染
      disabled: !form.watch('password'),
    }),
    // 仅当需要输入密码时（新增或编辑时修改密码）才渲染确认密码字段
    shouldRender: (formValues) => !isEdit || (isEdit && !!formValues.password),
  },
]
