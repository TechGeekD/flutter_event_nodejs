import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateMatchDTO, IMatch } from "./dto/create-match.dto";
import { CreateMatchResultDTO } from "./dto/create-match-result.dto";

@Injectable()
export class MatchService {
	constructor(
		@InjectModel("Match") private readonly matchModel: Model<IMatch>,
		@InjectModel("MatchResult")
		private readonly matchResultModel: Model<IMatch>,
	) {}

	async createNewMatch(createMatchDTO: CreateMatchDTO) {
		const createdMatch = new this.matchModel(createMatchDTO);
		await createdMatch.save();

		const matchJSON = createdMatch.toResponseJSON();

		return matchJSON;
	}

	async getAllMatch() {
		const allMatch = await this.matchModel
			.find()
			.populate({
				path: "eventId",
				model: "Event",
				populate: [
					{
						path: "createdBy",
						model: "User",
					},
				],
			})
			.populate("participantId");

		if (!allMatch) {
			throw new NotFoundException("Error Event Match Not Found");
		}

		return allMatch.map(match => {
			return match.toResponseJSON();
		});
	}

	async getMatchDetails(matchId: string) {
		const matchDetails = await this.matchModel
			.findById(matchId)
			.populate("participantId");

		if (!matchDetails) {
			throw new NotFoundException("Error Event Match Not Found");
		}

		return matchDetails.toResponseJSON();
	}

	async getAllMatchByEventId(eventId: string) {
		const allMatch = await this.matchModel.find({ eventId });

		if (!allMatch) {
			throw new NotFoundException("Error Event Match Not Found");
		}

		return allMatch.map(match => {
			return match.toResponseJSON();
		});
	}

	async createNewMatchResult(createMatchResultDTO: CreateMatchResultDTO) {
		const createdMatchResult = new this.matchResultModel(createMatchResultDTO);
		await createdMatchResult.save();

		const matchResultJSON = createdMatchResult.toResponseJSON();

		return matchResultJSON;
	}

	async getAllMatchResult() {
		const allMatchResult = await this.matchResultModel
			.find()
			.populate({
				path: "matchId",
				model: "Match",
				populate: [
					{
						path: "eventId",
						model: "Event",
						populate: [
							{
								path: "createdBy",
								model: "User",
							},
						],
					},
					{
						path: "participantId",
						model: "User",
					},
				],
			})
			.populate("participantId")
			.populate({
				path: "eventId",
				model: "Event",
				populate: [
					{
						path: "createdBy",
						model: "User",
					},
				],
			});

		if (!allMatchResult) {
			throw new NotFoundException("Error Event Match Result Not Found");
		}

		return allMatchResult.map(matchResult => {
			return matchResult.toResponseJSON();
		});
	}

	async getAllMatchResultById(matchId: string) {
		const allMatchResult = await this.matchResultModel.find({ matchId });

		if (!allMatchResult) {
			throw new NotFoundException("Error Event Match Result Not Found");
		}

		return allMatchResult.map(matchResult => {
			return matchResult.toResponseJSON();
		});
	}

	async getGlobalLeaderBoard() {
		const leaderBoardOfEvent = await this.matchResultModel
			.aggregate([
				{
					$match: {
						status: "win",
					},
				},
			])
			.group({
				_id: "$participantId",
				result: {
					$push: {
						matchId: "$matchId",
						eventId: "$eventId",
						value: "$result.value",
					},
				},
				matchWon: {
					$sum: 1,
				},
			})
			.project({
				result: 1,
				highScore: {
					$max: "$result.value",
				},
				matchWon: 1,
			})
			.sort({
				matchWon: -1,
				highScore: -1,
			})
			.collation({ locale: "en_US", numericOrdering: true });

		if (!leaderBoardOfEvent) {
			throw new NotFoundException("Error Global LeaderBoard Data Not Found");
		}

		return leaderBoardOfEvent;
	}

	async getLeaderBoardOfEvent(eventId: string) {
		const leaderBoardOfEvent = await this.matchResultModel
			.aggregate([
				{
					$match: {
						eventId,
						status: "win",
					},
				},
			])
			.group({
				_id: "$participantId",
				result: {
					$push: {
						matchId: "$matchId",
						eventId: "$eventId",
						value: "$result.value",
					},
				},
				matchWon: {
					$sum: 1,
				},
			})
			.project({
				result: 1,
				highScore: {
					$max: "$result.value",
				},
				matchWon: 1,
			})
			.sort({
				matchWon: -1,
				highScore: -1,
			})
			.collation({ locale: "en_US", numericOrdering: true });

		if (!leaderBoardOfEvent) {
			throw new NotFoundException("Error Event LeaderBoard Data Not Found");
		}

		return leaderBoardOfEvent;
	}
}
