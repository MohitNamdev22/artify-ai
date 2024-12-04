// import { auth } from "@clerk/nextjs/server";
// import Image from "next/image";
// import { redirect } from "next/navigation";

// import { Collection } from "@/components/shared/Collection";
// import { getUserImages } from "@/lib/actions/image.action";
// import { getUserById } from "@/lib/actions/user.actions";
// import { navLinks } from "@/constants";
// import Link from "next/link";

// const Home = async ({ searchParams }: SearchParamProps) => {
//   const page = Number(searchParams?.page) || 1;
//   const { userId } = await auth();

//   if (!userId) redirect("/sign-in");

//   const user = await getUserById(userId);
//   const images = await getUserImages({ page, userId: user._id });

//   return (
//     <>
//       <section className="home">
//         <h1 className="home-heading">
//           Unleash Your Creativity with Artify AI
//         </h1>
//         <ul className="flex-center w-full gap-20">
//           {navLinks.slice(1, 5).map((link) => (
//             <Link
//               key={link.route}
//               href={link.route}
//               className="flex-center flex-col gap-2">
//               <li className="flex-center w-fit rounded-full bg-white p-4">
//                 <Image src={link.icon} alt="icon" width={24} height={24} />
//               </li>
//               <p className="p-14-medium text-center text-white">{link.label}</p>
//             </Link>
//           ))}
//         </ul>
//       </section>
//       <section className="sm:mt-12">
//         <Collection
//           hasSearch={true}
//           images={images?.data}
//           totalPages={images?.totalPages}
//           page={page}
//         />
//       </section>
//     </>
//   );
// };

// export default Home;

import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

import { Collection } from "@/components/shared/Collection";
import Header from "@/components/shared/Header";
import { getUserImages } from "@/lib/actions/image.action";
import { getUserById } from "@/lib/actions/user.actions";

const Home = async ({ searchParams }: SearchParamProps) => {
  const page = Number(searchParams?.page) || 1;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);
  const images = await getUserImages({ page, userId: user._id });

  return (
    <>
      <Header title="Profile" />

      <section className="profile">
        <div className="profile-balance">
          <p className="p-14-medium md:p-16-medium">CREDITS AVAILABLE</p>
          <div className="mt-4 flex items-center gap-4">
            <Image
              src="/assets/icons/coins.svg"
              alt="coins"
              width={50}
              height={50}
              className="size-9 md:size-12"
            />
            <h2 className="h2-bold text-dark-600">{user.creditBalance}</h2>
          </div>
        </div>

        <div className="profile-image-manipulation">
          <p className="p-14-medium md:p-16-medium">IMAGE MANIPULATION DONE</p>
          <div className="mt-4 flex items-center gap-4">
            <Image
              src="/assets/icons/photo.svg"
              alt="coins"
              width={50}
              height={50}
              className="size-9 md:size-12"
            />
            <h2 className="h2-bold text-dark-600">{images?.data.length}</h2>
          </div>
        </div>
      </section>
      <section className="mt-8 md:mt-14">
        <Collection
          images={images?.data}
          totalPages={images?.totalPages}
          page={page}
        />
      </section>
    </>
  );
};

export default Home;