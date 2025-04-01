// src/components/form/types.ts
import React from 'react'
import { z } from 'zod'
import { UseFormReturn } from 'react-hook-form'
import { Button } from '../ui/button'

// 通用的组件映射类型
export type ComponentMap = Record<string, React.ComponentType<any>>

// 通用的表单字段配置类型
// TFormData 是表单数据的类型，由 Zod schema 推断出来
export interface FormFieldConfigGeneric<TFormData extends Record<string, any>> {
  name: keyof TFormData // 强制使用表单数据类型的 key
  label: string
  componentType: keyof ComponentMap // 必须是 ComponentMap 中的 key
  componentProps?: Record<string, any> // 静态 props
  // 动态 props，接收 form 实例
  getDynamicProps?: (form: UseFormReturn<TFormData>) => Record<string, any>
  // 布局相关配置 (可选)
  gridConfig?: {
    label?: string // e.g., 'col-span-2 text-right'
    control?: string // e.g., 'col-span-4'
    message?: string // e.g., 'col-span-4 col-start-3'
  }
  // 条件渲染 (可选)
  shouldRender?: (formValues: TFormData) => boolean
}

// JsonForm 组件的 Props 类型
export interface JsonFormProps<TSchema extends z.AnyZodObject> {
  schema: TSchema
  config: FormFieldConfigGeneric<z.infer<TSchema>>[]
  componentMap: ComponentMap
  onSubmit: (data: z.infer<TSchema>) => void | Promise<void>
  defaultValues?: Partial<z.infer<TSchema>> // 使用 Partial 允许只提供部分默认值
  formId?: string // 用于外部提交按钮
  layoutProps?: {
    formClassName?: string // <form> 元素的 class
    fieldContainerClassName?: string // 每个 FormItem 的外部容器 class (如果需要)
    fieldItemClassName?: string // 每个 FormItem 的 class (默认为 grid ...)
  }
  submitButtonText?: string
  submitButtonProps?: React.ComponentProps<typeof Button> // 允许传递 Button 的 props
  children?: React.ReactNode // 允许在表单内部添加额外元素
}
