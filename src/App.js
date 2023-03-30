/** @format */

import React, { useState, useRef, useEffect } from "react";
import { BsFillPlayFill } from "react-icons/bs";
import { ImArrowUp } from "react-icons/im";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";
import "./App.css";

const App = () => {
	const [files, setFile] = useState(null);
	const [url, setUrl] = useState("");
	const [progress, setProgress] = useState(0);
	const [uploading, setUploading] = useState(false);
	const [dragged, setDragged] = useState(false);
	const [error, setError] = useState(false);
	const [parallelUploads, setParallelUploads] = useState();

	const inputRef = useRef(null);

	useEffect(() => {
		parallelUploads && parallelUploads.abort();
	}, [dragged]);

	async function fileChange(e) {
		let file;
		if (e.target.files) {
			setFile(e.target.files[0]);
			file = e.target.files[0];
		} else {
			file = e.dataTransfer.files[0];
		}

		const target = {
			Bucket: process.env.REACT_APP_BUCKET,
			Key: file.name,
			Body: file,
		};
		const creds = {
			accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
			secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY,
		};

		let parallelUploads = new Upload({
			client: new S3Client({
				region: process.env.REACT_APP_REGION,
				credentials: creds,
			}),
			leavePartsOnError: false,
			params: target,
		});

		setParallelUploads(parallelUploads);
		try {
			parallelUploads.on("httpUploadProgress", (progress) => {
				setUploading(true);
				setProgress((progress.loaded / progress.total) * 100);
			});

			parallelUploads
				.done()
				.then((data) => {
					setUploading(false);
					setUrl(data.Location);
				})
				.catch((err) => console.log(err));
		} catch (e) {
			console.log(e);
		}
	}

	const handleDrop = async (e) => {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (file && file.type === "video/mp4") {
			setFile(file);
			fileChange(e);
			setError(false);
		} else {
			setError(true);
		}
	};

	const onCancel = () => {
		setDragged((prev) => !prev);
		setFile(null);
		setUploading(false);
	};

	return (
		<div className="main-container">
			<div
				className="container"
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrop}
			>
				{!uploading && progress === 100 && (
					<video
						id="video-player"
						controls
						src={`${url}`}
						style={{
							display: files ? "block" : "none",
						}}
					/>
				)}
				<h1>You can upload video</h1>
				<div className="sub-heading">
					Click on the button or drag&drop files here
				</div>
				<div className="btn-container" onClick={() => inputRef.current.click()}>
					<input
						type="file"
						accept=".mp4"
						style={{ display: "none" }}
						ref={inputRef}
						onChange={fileChange}
					/>

					<div className="btn-icon">
						<ImArrowUp />
					</div>
					<div className="btn-text">Upload video</div>
				</div>

				{error ? (
					<div className="error">*Please upload only .mp4 file</div>
				) : null}

				{files && uploading && (
					<div className="file-container">
						<div className="sub-container">
							<div className="cross" onClick={onCancel}>
								X
							</div>
							<div className="file-detail-container">
								<div className="play-btn-container">
									<BsFillPlayFill
										size={30}
										color={"#9086f8"}
										cursor={"pointer"}
									/>
								</div>
								<div className="text-container">
									<div className="file-name-container">
										<span className="file">File </span>
										<span className="file-name">{files?.name}</span>
										<span id="upload-text" className="file">
											{" "}
											is uploading...
										</span>
									</div>
									<div className="progress-container">
										{progress !== 0 && (
											<div
												style={{ width: `${progress}%` }}
												className="progress-bar"
											/>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default App;
