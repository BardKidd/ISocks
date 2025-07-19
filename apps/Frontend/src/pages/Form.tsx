import { useForm, useFieldArray } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSchema, FormSchemaType } from '@/validation/formSchema';

const basicRowData = {
  username: '',
  age: '',
  email: '',
  remark: '',
};

const MyFormStudy = () => {
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(FormSchema),
    defaultValues: { items: [] },
    mode: 'onSubmit', // 只在 submit 時驗證
    reValidateMode: 'onBlur',
  });
  const { handleSubmit, control } = form;

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray<FormSchemaType, 'items'>({ control, name: 'items' });

  const onSubmit = (data: FormSchemaType) => {
    console.log(data);
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <div className="bg-gray-700/80 rounded-2xl shadow-2xl p-10 max-w-2xl w-full border border-gray-600">
        <h1 className="text-3xl font-bold text-cyan-300 mb-6 text-center drop-shadow">
          Dynamic Form
        </h1>
        <Button
          type="button"
          onClick={() => appendItem(basicRowData)}
          className="mb-6 px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold shadow hover:bg-cyan-500 transition"
        >
          Add new row
        </Button>

        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            {itemFields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-3 bg-gray-800/80 rounded-xl p-6 border border-gray-600 shadow"
              >
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
                <FormField
                  control={control}
                  name={`items.${index}.age`}
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-cyan-300 font-semibold text-base tracking-wide drop-shadow">
                        Age
                      </FormLabel>
                      <FormControl>
                        <Input className="px-4 py-2 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`items.${index}.email`}
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-cyan-300 font-semibold text-base tracking-wide drop-shadow">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input className="px-4 py-2 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`items.${index}.remark`}
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-cyan-300 font-semibold text-base tracking-wide drop-shadow">
                        Remark
                      </FormLabel>
                      <FormControl>
                        <Textarea className="px-4 py-2 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 min-h-[60px]" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="self-end mt-2 px-3 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                >
                  Remove this row
                </Button>
              </div>
            ))}
            <Button
              type="submit"
              className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-500 transition"
            >
              Submit
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default MyFormStudy;
