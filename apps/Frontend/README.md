# React Hook Form 教學筆記

## 1. 什麼是 React Hook Form?

> React Hook Form(RHF) 是一個用於 React 的輕量、高效能的表單管理套件。

**核心設計理念**：

- 使用 hook(主要是 `useForm`) 來驅動表單狀態管理
- 極致效能(只渲染受影響的欄位)
- 易於驗證與錯誤顯示

**適用場景**：需要管理中大型、多欄位、複雜驗證、高效能的 React 表單。

---

## 2. 安裝與快速開始

```bash
npm install react-hook-form
```

基本範例：

```jsx
import { useForm } from 'react-hook-form';

function App() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('example')} />
      <input type="submit" />
    </form>
  );
}
```

- register: 註冊表單欄位
- handleSubmit: 封裝送出流程
- formState.errors: 存放驗證錯誤

## 3. useForm API 核心用法

useForm 是所有功能的起點，會回傳多種工具與狀態。  
常見屬性有：

- register: 欄位註冊用，連接 input 控制權。
- handleSubmit: 處理 submit，包裝 onSubmit callback。
- watch: 監看欄位值(即時取得變化)。
- reset: 重置整個表單或特定欄位。
- setValue: 手動設定欄位值。
- getValues: 取得所有欄位目前值。
- trigger: 手動觸發驗證。
- control: 進階，給 Controller 元件用。
- formState: 表單的各種狀態(如 isDirty、isValid)

> `getValues` 與 `watch` 使用在 render 時的效果會看起來差不多。  
> 因為當畫面更新時以 `getValues` 取得的值會因為 re-render 而再次觸發取得最新值。

## 4. 欄位註冊 register 用法

```jsx
<input {...register('username')} />
```

加上驗證條件：

```jsx
<input
  {...register('username', {
    required: '必填',
    minLength: { value: 3, message: '至少輸入 3 個字元' },
  })}
/>
```

## 5. 錯誤訊息與驗證

所有錯誤都會集中在 formState.errors，以欄位名稱為 key。

```jsx
{
  errors.username && <span>{errors.username.message}</span>;
}
```

內建驗證規則

- required: 必填
- min/max: 數值範圍
- minLength/maxLength: 字串長度
- pattern: 正則驗證
- validate: 客製化驗證(callback)

## 6. 表單送出處理

一律用 handleSubmit(onSubmit) 包裝事件

```jsx
<form onSubmit={handleSubmit(onSubmit)}>{/** ... */}</form>
```

`onSubmit` 的參數及為所有欄位資料。

## 7. 進階功能

### 7.1 watch（即時監看欄位變化）

```jsx
const watchedValue = watch('username'); // 監看 username 欄位變化
```

### 7.2 reset（重置表單）

> reset 指的是整個表單的重置，就算你不指定重置後的預設值仍然會將原始值清空。

```jsx
reset(); // 重置整個表單
reset({ username: 'default' }); // 指定該欄位重置後需要的預設值
```

### 7.3 setValue/getValues

```jsx
setValue('username', 'new value');
const all = getValues();
```

### 7.4 動態欄位

當我們需要使用動態欄位時，可以使用 `useFieldArray` 來管理。  
在使用之前需要額外先將 `control` 從 `useForm` 中解構出來。並在 `useFieldArray` 中傳入 `control` 以及欄位名稱。

> 這個是固定寫法，必須多做一步將 `control` 傳入。  
> React Hook Form 需要這個屬性來操作陣列內的欄位，如果沒有傳送該表單就不會有效果。

```jsx
import { useForm, useFieldArray } from 'react-hook-form';

// other code...

const { control } = useForm();
const { fields, append, remove } = useFieldArray({
  control,
  name: 'items', // 欄位陣列名稱
});
// 這樣的結構設定完後，按下 submit 會得到 { items: [{...}, {...}] } 的內容
```

定義你需要的資料結構，透過 `append` 可以將這些欄位設定到你的陣列表單中。

```jsx
const basicData = {
  username: '',
  email: '',
  age: '',
  remark: '',
};

const { fields, append, remove } = useFieldArray({
  control,
  name: 'items', // 欄位陣列名稱
});

<button type="button" onClick={() => append(basicData)}>
  Add new row
</button>;
```

當新增完後可以看一下資料結構你會發現長這樣，多出來的 id 方便去在陣列中作為 key 使用：

```js
{
  id: '', // 由 React Hook Form 自動生成的唯一 ID
  username: '',
  email: '',
  age: '',
  remark: '',
}
```

為什麼 `remove()` 的寫法是傳入 `index` 而不是 `id`。  
這是因為 React Hook Form 的 `useFieldArray` 預期就傳入 `index` 才操作該陣列，在他的設計邏輯裡 `id` 是用來當作唯一值渲染畫面使用而非操作用。如果強硬使用 `id` 則不會有效果。

一個精美個陣列表單範例如下：

```jsx
import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

const MyFormStudy = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  const boxStyle = {
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    background: '#f9fafb',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    position: 'relative',
  };

  const inputStyle = {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '1rem',
  };

  const textareaStyle = {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '1rem',
    minHeight: '60px',
  };

  const basicRowData = {
    username: '',
    age: '',
    email: '',
    remark: '',
  };

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control, name: 'items' });

  const onSubmit = (data) => {
    console.log(data);
    console.log(errors);
  };

  return (
    <>
      <button type="button" onClick={() => appendItem(basicRowData)}>
        Add new row
      </button>

      <form onSubmit={handleSubmit(onSubmit)}>
        {itemFields.map((field, index) => (
          <div key={field.id} style={boxStyle}>
            <input
              style={inputStyle}
              placeholder="Username"
              {...register(`items.${index}.username`)}
            />
            <input
              style={inputStyle}
              placeholder="Age"
              {...register(`items.${index}.age`)}
            />
            <input
              style={inputStyle}
              placeholder="Email"
              {...register(`items.${index}.email`)}
            />
            <textarea
              style={textareaStyle}
              placeholder="Remark"
              {...register(`items.${index}.remark`)}
            />
            <button type="button" onClick={() => removeItem(index)}>
              Remove this row
            </button>
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </>
  );
};

export default MyFormStudy;
```

## 8. 整合 UI Library (以 shadcn/ui 為例)

> 基本資料可以參考 shadcn_ui.md。

schadcn/ui 有個 `react-hook-form` 的整合套件，可以讓我們更方便地使用。

```bash
npx shadcn@latest add form
```

常用的 Form 相關元件：

```tsx
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
```

跟前面的寫法有點差異，會需要改寫一下原始宣告的方法，且 form 會被包在 `<Form>` 元件中，而每個欄位則使用 `<FormField>` 包裝。

```tsx
// 改為這樣宣告而不是直接解構是因為之後會需要將 form 傳入 Form 元件中
const form = useForm();
const { handleSubmit, control } = form;

<Form {...form}>
  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
    {/* other code */}

    {/* 舊寫法 */}
    {/* 
      <input
        style={inputStyle}
        placeholder="Username"
        {...register(`items.${index}.username`)}
      /> 
    */}
    {/* 新寫法 */}
    <FormField
      control={control}
      name={`items.${index}.username`}
      render={() => (
        <FormItem>
          <FormLabel className="text-cyan-300 font-semibold text-base tracking-wide drop-shadow">
            Username
          </FormLabel>
          <FormControl>
            <Input className="px-4 py-2 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>;
```

改變動向：

- 除了 `useFieldArray` 需要 `control` 外，`FormField` 也需要傳入 `control`。這個是固定寫法。
- 原本使用 `register` 的方式改為使用 `FormField` 的 `name` 屬性來指定欄位名稱。
- `render` 可以直接將舊版的 JSX 元素放入。

直接使用原生的用法就好了為什麼要多包一層？  
這是因為 `FormField` 會自動處理錯誤訊息的顯示與欄位狀態的管理，讓我們不需要手動去處理驗證錯誤。

- 搭配 `FormMessage` 中顯示錯誤訊息
- 搭配 `FormLabel` 中顯示欄位名稱
- 搭配 `FormDescription` 中顯示欄位描述

## 9. 驗證 (以 Zod 為例)

React Hook Form 支援多種驗證庫，這裡以 Zod 為例。

```bash
npm install zod @hookform/resolvers
```

常見的驗證方式：

```jsx
import { z } from 'zod';

// 定義物件
export const ItemSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  age: z.string().min(1, 'Age is required'),
  email: z.string().email('Invalid email'),
  remark: z.string().optional(),
});

// 傳給陣列並確認結構
export const FormSchema = z.object({
  items: z.array(ItemSchema).min(1, 'At least one item is required'),
});

export type FormSchemaType = z.infer<typeof FormSchema>;
```

在 `useForm` 中使用：

```jsx
import { FormSchema, FormSchemaType } from '@/validation/formSchema';

const form = useForm<FormSchemaType>({
  resolver: zodResolver(FormSchema),
  defaultValues: { items: [] },
  mode: 'onSubmit', // 只在 submit 時驗證
  reValidateMode: 'onBlur',
});

const {
  fields: itemFields,
  append: appendItem,
  remove: removeItem,
} = useFieldArray<FormSchemaType, 'items'>({ control, name: 'items' });

const onSubmit = (data: FormSchemaType) => {
  console.log(data);
};
```
