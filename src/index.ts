import {
  Category,
  TCartPurchase,
  TProduct,
  TPurchase,
  TPurchaseProduct,
  TPurProduct,
  TUser,
} from "./types";
import express, { Request, Response } from "express";
import cors from "cors";
import { db } from "./database/knex";

const app = express();

app.use(express.json());
app.use(cors());

app.listen(3003, () => {
  console.log(`serviddor rodando na porta 3003`);
});

app.get("/ping", (req: Request, res: Response) => {
  res.send("DEUDEUDEU!");
});

app.get("/users", async (req: Request, res: Response) => {
  try {
    const getUsers = req.query.q as string | undefined;

    if (getUsers === undefined) {
      const result = await db.raw(`SELECT * FROM users`);
      res.status(200).send(result);
    }
  } catch (error: any) {
    console.log(error);

    if (res.statusCode === 200) {
      res.status(500);
    }
    res.send(error.message);
  }
});

app.post("/users", async (req: Request, res: Response) => {
  try {
    const { id, name, email, password } = req.body as TUser;
    if (typeof id !== "string") {
      res.status(400);
      throw new Error("Id DEVE ser uma string.");
    }
    if (typeof email !== "string") {
      res.status(400);
      throw new Error("Email DEVE ser uma string.");
    }
    if (typeof password !== "string") {
      res.status(400);
      throw new Error("password DEVE ser string.");
    }

    const [avalibleID] = await db("users").where({ id: id });

    if (avalibleID) {
      res.status(422);
      throw new Error("Id ja existente.");
    }
    const [avalibleEmail] = await db("users").where({ email: email });
    if (avalibleEmail) {
      res.status(422);
      throw new Error("Email ja existente.");
    }

    const newUser = {
      id,
      name,
      email,
      password,
      create_at: new Date(Date.now()).toUTCString(),
    };

    await db("users").insert(newUser);

    res.status(201).send({ message: "User criado com sucesso!", newUser });
  } catch (error) {
    console.log(error);

    if (res.statusCode === 200) {
      res.status(500);
    }

    if (error instanceof Error) {
      res.send({ message: error.message });
    } else {
      res.send({ message: "Erro inesperado." });
    }
  }
});

app.get("/products", async (req: Request, res: Response) => {
  try {
    const getProducts = req.query.q as string | undefined;

    if (getProducts === undefined) {
      const result = await db.raw(`SELECT * FROM products`);
      res.status(200).send(result);
    }
  } catch (error: any) {
    console.log(error);

    if (res.statusCode === 200) {
      res.status(500);
    }
    res.send(error.message);
  }
});
app.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const [user] = await db("users").where({ id: id });

    if (user) {
      const [purchaseID]: TPurchase[] | undefined = await db("purchases").where(
        { buyer_id: id }
      );
      if (purchaseID) {
        await db("purchase_products")
          .del()
          .where({ purchase_id: purchaseID.id });
        await db("purchases").del().where({ id: purchaseID.id });
      }
      await db("users").del().where({ id: id });
      res
        .status(200)
        .send({ message: "User apagado com sucesso", userRemoved: user });
    } else {
      res.status(404).send({ message: "Usuario não encontrado" });
    }
  } catch (error) {
    console.log(error);

    if (res.statusCode === 200) {
      res.status(500);
    }

    if (error instanceof Error) {
      res.send({ message: error.message });
    } else {
      res.send({ message: "Erro inesperado" });
    }
  }
});
