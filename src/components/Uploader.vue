<template>
	<div>
		<input type="file" :accept="accept" @input="getFile" />
		<div @click="upload">点击上传</div>
	</div>
</template>

<script>
	// import axios from 'axios';
	export default {
		props: {
			accept: {
				type: String,
				default: 'image/jpg, image/jpeg',
			},
			chunkSize: {
				type: Number,
				default: 10240,
			}
		},
		data() {
			return {
				file: null,
				fileChunkList: [],
			}
		},
		methods: {
			getFile(e) {
				this.file = e.target.files[0];
				this.fileChunkList = this.createFileChunkList(this.file, this.chunkSize).map((file, index) => {

					return {
						chunk: file,
						hash: this.file.name + '_' + index
					}
				});
			},
			upload() {
				const requestList = this.fileChunkList
					.map(({
						chunk,
						hash
					}) => {
						const formData = new FormData();
						formData.append('chunk', chunk.file);
						formData.append('hash', hash);
						formData.append('filename', this.file.name);
						return {
							formData
						};
					}).map(({
						formData
					}) => {
						// const headerConfig = {
						// 	headers: {
						// 		'Content-Type': 'multipart/form-data'
						// 	}
						// };
						// return axios.post('http://localhost:3000/upload/chunk', formData, headerConfig);
						return this.request({
							url: 'http://localhost:3000/upload/chunk',
							data: formData,
							method: 'POST',
						})
					});
				Promise.all(requestList).then((data) => {
					this.mergeChunk();
				}).catch(err => {
					console.log('err', err)
				})

			},
			mergeChunk() {
				this.request({
					url: 'http://localhost:3000/upload/merge',
					method: 'POST',
					data: JSON.stringify({
						filename: this.file.name,
						chunkSize: this.chunkSize,
						size: this.file.size
					}),
					headers: {
						"Content-Type": "application/json"
					}
				})
			},
			createFileChunkList(file, size) {
				const fileChunkList = [];
				let curSize = 0;
				while (curSize < file.size) {
					fileChunkList.push({
						file: file.slice(curSize, (curSize + size))
					})
					curSize += size;
				}
				return fileChunkList
			},
			request({
				data,
				url,
				method,
				headers = {},
			}) {
				return new Promise((resolve) => {
					const xhr = new XMLHttpRequest();
					xhr.open(method, url, true);
					Object.keys(headers).forEach(key => {
						xhr.setRequestHeader(key, headers[key])
					})
					xhr.send(data);
					xhr.onreadystatechange = () => {
						if (xhr.readyState == 4 && xhr.status == 200) {
							resolve(xhr.responseText)
						}
					}
				})
			}
		}
	}
</script>

<style scoped>

</style>
