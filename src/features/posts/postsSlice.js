import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../firebase";

// Data = posts[] , loading(true,false)
// Actions = read posts, create a post, update my posts, delete a post

// Async thunk for fetching a user's post
export const fetchPostsByUser = createAsyncThunk(
    "posts/fetchByUser",
    async (userId) => {
        try {
            // make reference to posts (database, location)
            const postsRef = collection(db, `users/${userId}/posts`);

            const querySnapshot = await getDocs(postsRef);
            // create array of docs
            const docs = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            return docs;

        } catch (error) {
            console.error(error)
            throw error;
        }
    }
);

export const savePost = createAsyncThunk(
    "posts/savePost",
    async ({ userId, postContent }) => {
        try {
            // make reference to posts (database, location)
            const postsRef = collection(db, `users/${userId}/posts`);
            console.log(`users/${userId}/posts`);
            // Since no ID is given, firestore auto generate a unique ID for this new document
            const newPostRef = doc(postsRef);
            console.log(postContent)

            await setDoc(newPostRef, { content: postContent, likes: [] });
            const newPost = await getDoc(newPostRef);

            const post = {
                id: newPost.id,
                ...newPost.data()
            };
            return post;

        } catch (error) {
            console.error(error)
            throw error;
        }
    }
);

export const likePost = createAsyncThunk("posts/likePost",
    async ({ userId, postId }) => {
        try {
            const postRef = doc(db, `users/${userId}/posts/${postId}`);

            const docSnap = await getDoc(postRef);

            if (docSnap.exists()) {
                const postData = docSnap.data();
                const likes = [...postData.likes, userId];

                await setDoc(postRef, { ...postData, likes });
            }
            return { userId, postId };
        } catch (error) {
            console.error(error)
            throw error;
        }
    }
);

export const removeLikeFromPost = createAsyncThunk(
    "posts/removeLikeFromPost",
    async ({ userId, postId }) => {
        try {

            const postRef = doc(db, `users/${userId}/posts/${postId}`);
            const docSnap = await getDoc(postRef);

            if (docSnap.exists()) {
                const postData = docSnap.data();

                const newLikes = postData.likes.filter((id) => id !== userId)

                await setDoc(postRef, { ...postData, likes: newLikes })

            }
            return { userId, postId };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
);

// Slice
const postsSlice = createSlice({
    name: "posts",
    initialState: { posts: [], loading: true },
    reducers: {}, // Synchronous operations only
    extraReducers: (builder) => {
        // Asynchronous operations
        builder
            .addCase(fetchPostsByUser.fulfilled, (state, action) => {
                state.posts = action.payload;
                state.loading = false;
            })
            .addCase(savePost.fulfilled, (state, action) => {
                state.posts = [action.payload, ...state.posts];
            })
            .addCase(likePost.fulfilled, (state, action) => {
                const { userId, postId } = action.payload // { userId, postId }

                const postIndex = state.posts.findIndex((post) => post.id === postId)
                if (postIndex !== -1) {
                    state.posts[postIndex].likes.push(userId)
                }
            })
            .addCase(removeLikeFromPost.fulfilled, (state, action) => {
                const { userId, postId } = action.payload

                const postIndex = state.posts.findIndex((post) => post.id === postId)
                if (postIndex !== -1) {
                    state.posts[postIndex].likes = state.posts[postIndex].likes.filter((id) => id !== userId);
                }
            });
    },
});

export default postsSlice.reducer;