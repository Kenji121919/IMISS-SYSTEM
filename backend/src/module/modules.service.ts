import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Module } from '../entities/module.entity'
import { ModuleColumn } from '../entities/module-column.entity'
import {
  ModuleTemplate,
  TemplateKind,
  TemplatePrintMode,
} from '../entities/module-template.entity'


@Injectable()
export class ModulesService {

  constructor(

    @InjectRepository(Module)
    private repo: Repository<Module>,

    @InjectRepository(ModuleTemplate)
    private templateRepo: Repository<ModuleTemplate>,

    @InjectRepository(ModuleColumn)
    private colRepo: Repository<ModuleColumn>,

  ) {}


  /* =========================================================
     HELPERS
  ========================================================= */

  private parseJson(value: any, fallback: any = null) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return fallback
    }

    if (
      typeof value === 'object'
    ) {
      return value
    }

    try {

      return JSON.parse(value)

    } catch {

      return fallback

    }

  }



  private defaultMonitoringConfig() {

    return {
      enabled: false,
      title: 'Monitoring',
      itemColumn: '',
      locationColumn: '',
      borrowDateColumn: '',
      returnDateColumn: '',
      statusColumn: '',
      autoOpen: false,
    }

  }


  private normalizeMonitoringConfig(
    value: any,
  ) {

    const parsed =
      this.parseJson(
        value,
        {},
      )

    return {
      ...this.defaultMonitoringConfig(),
      ...(parsed || {}),
    }

  }


  private defaultUpcomingConfig() {

    return {

      enabled: false,

      title:
        'Upcoming Reminder',

      dateColumn:
        '',

      timeColumn:
        '',

      defaultTime:
        '08:00',

      leadValue:
        1,

      leadUnit:
        'hours',

      labelColumn:
        '',

      detailColumn:
        '',

      autoPopup:
        true,

      browserNotification:
        false,

    }

  }


  private normalizeUpcomingConfig(
    value: any,
  ) {

    const parsed =
      this.parseJson(
        value,
        {},
      )

    return {

      ...this.defaultUpcomingConfig(),

      ...(parsed || {}),

    }

  }


  /* =========================================================
     CREATE
  ========================================================= */

  async create(body: any) {

    const module =
      this.repo.create({

        name:
          body.name,

        allowedProfilesRaw:
          JSON.stringify(
            (
              body.allowedProfiles ||
              []
            ).map(Number),
          ),

        userId:
          body.userId,

        templateStartRow:
          body.templateStartRow ??
          8,

        templateRowsPerPage:
          body.templateRowsPerPage ??
          9,

        templateRowsPerRecord:
          body.templateRowsPerRecord ??
          1,

        /*
         * NEW:
         * Store upcoming alert configuration.
         */
        monitoringConfigRaw:
          JSON.stringify(
            this.normalizeMonitoringConfig(
              body.monitoringConfig,
            ),
          ),

        upcomingConfigRaw:
          JSON.stringify(
            this.normalizeUpcomingConfig(
              body.upcomingConfig,
            ),
          ),

      })


    module.templateMappings =
      body.templateMappings ??
      []


    const saved =
      await this.repo.save(
        module,
      )


    const columns =
      (
        body.columns ||
        []
      ).map(
        (col: any) =>

          this.colRepo.create({

            name:
              col.name,

            type:
              col.type,

            optionsRaw:
              JSON.stringify(
                Array.isArray(
                  col.options,
                )
                  ? col.options
                  : [],
              ),

            baseUrl:
              col.baseUrl ??
              '',

            filterable:
              col.filterable ??
              false,

            required:
              col.required ??
              false,

            module: {
              id: saved.id,
            },

          }),

      )


    if (
      columns.length
    ) {

      await this.colRepo.save(
        columns,
      )

    }


    return this.findOne(
      saved.id,
    )

  }


  /* =========================================================
     FIND ALL
  ========================================================= */

  async findAll(
    userId: number,
  ) {

    const mods =
      await this.repo.find({

        where: {
          userId,
        },

        relations: [
          'columns',
          'templates',
        ],

      })


    return mods.map(
      m => ({

        ...m,


        allowedProfiles:
          (() => {

            try {

              return JSON.parse(
                (m as any)
                  .allowedProfilesRaw ||
                '[]',
              )

            } catch {

              return []

            }

          })(),


        /*
         * NEW:
         * Return parsed upcoming config.
         */
        monitoringConfig:
          this.normalizeMonitoringConfig(
            (m as any)
              .monitoringConfigRaw,
          ),

        upcomingConfig:
          this.normalizeUpcomingConfig(
            (m as any)
              .upcomingConfigRaw,
          ),


        templateMappings:
          m.templateMappings,


        columns:
          m.columns.map(
            c => ({

              ...c,

              options:
                (() => {

                  try {

                    return JSON.parse(
                      (c as any)
                        .optionsRaw ||
                      '[]',
                    )

                  } catch {

                    return []

                  }

                })(),

            }),
          ),

      }),
    )

  }


  /* =========================================================
     FIND ONE
  ========================================================= */

  async findOne(
    id: number,
  ) {

    const mod =
      await this.repo.findOne({

        where: {
          id,
        },

        relations: [
          'columns',
          'templates',
        ],

      })


    if (!mod) {
      return null
    }


    return {

      ...mod,


      allowedProfiles:
        (() => {

          try {

            return JSON.parse(
              (mod as any)
                .allowedProfilesRaw ||
              '[]',
            )

          } catch {

            return []

          }

        })(),


      /*
       * NEW:
       * DynamicModule.vue receives this.
       */
      monitoringConfig:
        this.normalizeMonitoringConfig(
          (mod as any)
            .monitoringConfigRaw,
        ),

      upcomingConfig:
        this.normalizeUpcomingConfig(
          (mod as any)
            .upcomingConfigRaw,
        ),


      templateMappings:
        mod.templateMappings,


      columns:
        mod.columns.map(
          c => ({

            ...c,

            options:
              (() => {

                try {

                  return JSON.parse(
                    (c as any)
                      .optionsRaw ||
                    '[]',
                  )

                } catch {

                  return []

                }

              })(),

          }),
        ),

    }

  }


  /* =========================================================
     UPDATE
  ========================================================= */

  async update(
    id: number,
    body: any,
  ) {

    const module =
      await this.repo.findOne({
        where: {
          id,
        },
        relations: [
          'columns',
        ],
      })


    if (!module) {
      return null
    }


    /*
     * Keep the OLD column IDs before clearing the relation.
     */
    const oldColumnIds =
      (module.columns || []).map(
        c => c.id,
      )


    /*
     * Update MODULE-LEVEL fields first.
     */
    module.name =
      body.name ?? module.name


    if (body.allowedProfiles !== undefined) {
      module.allowedProfilesRaw =
        JSON.stringify(
          (
            body.allowedProfiles ||
            []
          ).map(Number),
        )
    }


    module.templateStartRow =
      body.templateStartRow ??
      module.templateStartRow ??
      8


    module.templateRowsPerPage =
      body.templateRowsPerPage ??
      module.templateRowsPerPage ??
      9


    module.templateRowsPerRecord =
      body.templateRowsPerRecord ??
      module.templateRowsPerRecord ??
      1


    if (body.templateMappings !== undefined) {
      module.templateMappings =
        body.templateMappings
    }


    /*
     * Monitoring configuration.
     */
    if (body.monitoringConfig !== undefined) {
      module.monitoringConfigRaw =
        JSON.stringify(
          this.normalizeMonitoringConfig(
            body.monitoringConfig,
          ),
        )
    }


    /*
     * Upcoming alert configuration.
     */
    if (body.upcomingConfig !== undefined) {
      module.upcomingConfigRaw =
        JSON.stringify(
          this.normalizeUpcomingConfig(
            body.upcomingConfig,
          ),
        )
    }


    /*
     * CRITICAL FIX:
     * The Module.columns relation is eager and may also be cascaded
     * in older entity versions. Clear the stale relation BEFORE
     * saving the parent module.
     */
    module.columns = []


    /*
     * Save the parent BEFORE replacing child rows.
     */
    await this.repo.save(
      module,
    )


    /*
     * Delete OLD columns only after the parent has been saved.
     */
    if (oldColumnIds.length) {
      await this.colRepo.delete(
        oldColumnIds,
      )
    }


    /*
     * Re-create columns exactly as received from the frontend.
     * "time" is preserved here as a normal string value.
     */
    const newColumns =
      (
        body.columns ||
        []
      ).map(
        (col: any) =>

          this.colRepo.create({
            name:
              col.name,

            type:
              col.type ||
              'text',

            optionsRaw:
              JSON.stringify(
                Array.isArray(
                  col.options,
                )
                  ? col.options
                  : [],
              ),

            baseUrl:
              col.baseUrl ??
              '',

            filterable:
              col.filterable ??
              false,

            required:
              col.required ??
              false,

            module: {
              id,
            },
          }),
      )


    if (newColumns.length) {
      await this.colRepo.save(
        newColumns,
      )
    }


    /*
     * Debug output.
     */
    console.log(
      '[ModulesService.update] MODULE:',
      id,
    )

    console.log(
      '[ModulesService.update] COLUMNS RECEIVED:',
      (body.columns || []).map(
        (c: any) => ({
          name: c.name,
          type: c.type,
          required: c.required,
          filterable: c.filterable,
        }),
      ),
    )

    console.log(
      '[ModulesService.update] COLUMNS SAVED:',
      newColumns.map(
        c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          required: c.required,
          filterable: c.filterable,
        }),
      ),
    )


    /*
     * IMPORTANT:
     * Do NOT call this.repo.save(module) here again.
     * Reload fresh relations from the database instead.
     */
    return this.findOne(
      id,
    )

  }


  /* =========================================================
     DELETE MODULE
  ========================================================= */

  async delete(
    id: number,
  ) {

    return this.repo.delete(
      id,
    )

  }


  /* =========================================================
     LEGACY EXCEL TEMPLATE
  ========================================================= */

  async saveTemplate(

    id: number,

    filename: string,

    originalName: string,

    mimetype: string,

  ) {

    const module =
      await this.repo.findOne({

        where: {
          id,
        },

      })


    if (!module) {

      throw new Error(
        'Module not found',
      )

    }


    module.templateFile =
      filename


    module.templateFileName =
      originalName


    module.templateFileMime =
      mimetype


    await this.repo.save(
      module,
    )


    return {

      success:
        true,

      filename,

      originalName,

    }

  }


  /* =========================================================
     MULTI-TEMPLATE SUPPORT
  ========================================================= */

  async listTemplates(
    moduleId: number,
  ) {

    return this.templateRepo.find({

      where: {
        moduleId,
      },

    })

  }


  async saveNewTemplate(

    moduleId: number,

    name: string,

    kind: TemplateKind,

    file: Express.Multer.File,

    printMode: TemplatePrintMode = 'row',

    batchConfig: any = null,

  ) {

    const tpl =
      this.templateRepo.create({

        moduleId,

        name,

        kind,

        printMode:
          printMode === 'batch'
            ? 'batch'
            : 'row',

        batchConfig:
          batchConfig || null,

        file:
          file.filename,

        fileName:
          file.originalname,

        fileMime:
          file.mimetype,

        mappings:
          [],

      })


    return this.templateRepo.save(
      tpl,
    )

  }


  async getTemplateById(
    templateId: number,
  ) {

    return this.templateRepo.findOne({

      where: {
        id: templateId,
      },

    })

  }


  async updateTemplateMappings(

    templateId: number,

    mappings: any[],

  ) {

    const tpl =
      await this.templateRepo.findOne({

        where: {
          id: templateId,
        },

      })


    if (!tpl) {
      return null
    }


    tpl.mappings =
      mappings


    return this.templateRepo.save(
      tpl,
    )

  }


  async updateTemplateConfig(

    templateId: number,

    body: {
      name?: string
      printMode?: TemplatePrintMode
      batchConfig?: any
    },

  ) {

    const tpl =
      await this.templateRepo.findOne({
        where: {
          id: templateId,
        },
      })


    if (!tpl) {
      return null
    }


    if (body.name !== undefined) {
      tpl.name =
        String(
          body.name
        ).trim() ||
        tpl.name
    }


    if (body.printMode !== undefined) {
      tpl.printMode =
        body.printMode === 'batch'
          ? 'batch'
          : 'row'
    }


    if (body.batchConfig !== undefined) {
      tpl.batchConfig =
        body.batchConfig || null
    }


    return this.templateRepo.save(
      tpl,
    )

  }


  /* =========================================================
     DELETE LEGACY / BATCH EXCEL TEMPLATE
  ========================================================= */

  async deleteLegacyTemplate(
    id: number,
  ) {

    const module =
      await this.repo.findOne({
        where: {
          id,
        },
      })


    if (!module) {
      return {
        success: false,
        message: 'Module not found',
      }
    }


    module.templateFile =
      null as any

    module.templateFileName =
      null as any

    module.templateFileMime =
      null as any

    module.templateMappings =
      []


    await this.repo.save(
      module,
    )


    return {
      success: true,
      message:
        'Excel template removed successfully',
    }

  }


  async deleteTemplate(
    templateId: number,
  ) {

    return this.templateRepo.delete(
      templateId,
    )

  }

}