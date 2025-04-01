// src/components/form/JsonForm.tsx
'use client'; // 如果你的组件或依赖项需要客户端环境

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button'; // 假设 Button 是通用的
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'; // 假设这些是通用的
import { JsonFormProps, FormFieldConfigGeneric, ComponentMap } from './types';

// 默认的 Grid 配置
const defaultGridConfig = {
  label: 'col-span-2 text-right',
  control: 'col-span-4',
  message: 'col-span-4 col-start-3',
};

export function JsonForm<TSchema extends z.AnyZodObject>({
  schema,
  config,
  componentMap,
  onSubmit,
  defaultValues,
  formId = 'json-form',
  layoutProps = {},
  submitButtonText = 'Submit',
  submitButtonProps = {},
  children, // 接收 children prop
}: JsonFormProps<TSchema>) {
  type TFormData = z.infer<TSchema>;

  const form = useForm<TFormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as TFormData, // RHF 需要完整的 TFormData 类型
  });

  const { formClassName = 'space-y-4 p-0.5', fieldItemClassName = 'grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0' } = layoutProps;

  const handleFormSubmit = async (data: TFormData) => {
    await onSubmit(data); // 支持异步 onSubmit
    // 考虑是否在这里 reset，通常由父组件决定何时重置
    // form.reset();
  };

  return (
    // 使用 RHF 的 FormProvider 包裹，方便深层组件访问 form 实例 (如果需要)
    <FormProvider {...form}>
      <Form {...form}> {/* shadcn/ui Form component */}
        <form
          id={formId}
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className={formClassName}
        >
          {config.map((fieldConfig: FormFieldConfigGeneric<TFormData>) => {
            // 条件渲染检查
            if (fieldConfig.shouldRender && !fieldConfig.shouldRender(form.getValues())) {
                return null;
            }

            const Component = componentMap[fieldConfig.componentType];
            if (!Component) {
              console.error(
                `Component type "${fieldConfig.componentType}" not found in componentMap.`
              );
              return (
                <div key={String(fieldConfig.name)} className='text-red-500'>
                  Error: Component "{fieldConfig.componentType}" missing.
                </div>
              );
            }

            const dynamicProps = fieldConfig.getDynamicProps
              ? fieldConfig.getDynamicProps(form)
              : {};

            const grid = { ...defaultGridConfig, ...fieldConfig.gridConfig };

            return (
              <FormField
                key={String(fieldConfig.name)} // key 必须是 string
                control={form.control}
                name={fieldConfig.name}
                render={({ field }) => (
                  <FormItem className={fieldItemClassName}>
                    <FormLabel className={grid.label}>
                      {fieldConfig.label}
                    </FormLabel>
                    <FormControl>
                      {/*
                        传递 field、静态 props 和动态 props
                        确保你的自定义组件能正确处理 RHF 的 field 对象 (value, onChange, etc.)
                        或像 SelectDropdown 那样显式处理需要的属性
                      */}
                      <Component
                        {...field}
                        {...fieldConfig.componentProps}
                        {...dynamicProps}
                        // 特殊处理 SelectDropdown 等需要显式映射的组件 (如果它们不直接支持 ...field)
                        {...(fieldConfig.componentType === 'select' && {
                            defaultValue: field.value, // 可能需要
                            onValueChange: field.onChange, // 可能需要
                        })}

                      />
                    </FormControl>
                    <FormMessage className={grid.message} />
                  </FormItem>
                )}
              />
            );
          })}

          {/* 允许在表单字段后、提交按钮前插入自定义内容 */}
          {children}

          {/* 可以选择是否包含提交按钮，或者让父组件提供 */}
          
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              form={formId} // Link button to form if needed
              disabled={form.formState.isSubmitting}
              {...submitButtonProps} // 传递额外的 button props
            >
              {form.formState.isSubmitting ? 'Submitting...' : submitButtonText}
            </Button>
          </div>
         
        </form>
      </Form>
    </FormProvider>
  );
}